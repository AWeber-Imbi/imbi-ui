import PropTypes, { string } from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { validate } from 'jsonschema'

import { Context } from '../../../state'
import { ErrorBoundary, Form } from '../../../components'

import { jsonSchema } from '../../../schema/Project'
import { metadataAsOptions } from '../../../settings'
import { httpGet, httpPost } from '../../../utils'

import { AutomationList } from '../AutomationList'

const EMPTY_FIELDS = {
  namespace_id: null,
  project_type_id: null,
  name: null,
  slug: null,
  description: null
}

function Create() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [globalState] = useContext(Context)
  const [errorMessage, setErrorMessage] = useState(null)
  const [fieldValues, setFieldValues] = useState(EMPTY_FIELDS)
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELDS)
  const [isReady, setIsReady] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [automations, setAutomations] = useState([])
  const [selectedAutomations, setSelectedAutomations] = useState([])

  useEffect(() => {
    /* fetch automations available for selected project type */
    if (fieldValues.project_type_id) {
      const url = new URL('/ui/available-automations', globalState.baseURL)
      url.searchParams.append('project_type_id', fieldValues.project_type_id)
      url.searchParams.append('category', 'create-project')
      httpGet(
        globalState.fetch,
        url,
        ({ data }) => {
          setAutomations(
            data
              .filter(
                ({ integration_name }) =>
                  globalState.integrations[integration_name]?.enabled
              )
              .map(
                ({ automation_name, integration_name, automation_slug }) => ({
                  automationName: automation_name,
                  integrationName: integration_name,
                  automationSlug: automation_slug
                })
              )
          )
        },
        ({ error }) => {
          setErrorMessage(error)
        }
      )
    }
  }, [fieldValues.project_type_id])

  useEffect(() => {
    /* remove any previously selected automations that are no longer available */
    const automationSlugs = new Set(automations.map((a) => a.automationSlug))
    setSelectedAutomations((prevState) =>
      prevState.filter((slug) => automationSlugs.has(slug))
    )
  }, [automations])

  const onChange = (key, value) => {
    /* update fieldValues property named `key` */
    if (fieldValues[key] !== value) {
      const newValues = { ...fieldValues, [key]: value }
      const result = validate(newValues, jsonSchema)
      const errors = {}
      if (result.errors.length > 0) {
        setIsReady(false)
        result.errors.forEach((err) => {
          err.path.forEach((field) => {
            if (newValues[field] !== null) {
              errors[field] = err.message
            }
          })
        })
        setFieldErrors(errors)
      } else {
        setFieldErrors(EMPTY_FIELDS)
        setIsReady(true)
      }
      /* special handling to autogenerate slug from name */
      if (key === 'name') {
        const slugifier = (value) =>
          value
            .replace(/[^-A-Za-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-*/, '')
            .replace(/-*$/, '')
            .toLowerCase()
        if (fieldValues.name) {
          const oldSlug = slugifier(fieldValues.name)
          if (fieldValues.slug === oldSlug || !fieldValues.slug) {
            newValues.slug = slugifier(newValues.name)
          }
        }
      }
      setFieldValues(newValues)
    }
  }

  const onCancel = () => {
    navigate(-1)
  }

  const onSubmit = async () => {
    setIsSaving(true)
    const response = await httpPost(
      globalState.fetch,
      new URL('/projects', globalState.baseURL),
      {
        name: fieldValues.name,
        namespace_id: fieldValues.namespace_id,
        project_type_id: fieldValues.project_type_id,
        slug: fieldValues.slug,
        description: fieldValues.description,
        automations: selectedAutomations
      }
    )
    setIsSaving(false)
    if (response.success) {
      navigate(`/ui/projects/${response.data.id}`)
    } else {
      let errorMessage = response.data
      if (response.responseBody?.title) {
        if (response.responseBody?.detail) {
          errorMessage = `${response.responseBody.title} - ${response.responseBody.detail}`
        } else {
          errorMessage = response.responseBody.title
        }
      }
      setErrorMessage(errorMessage)
    }
  }

  return (
    <ErrorBoundary>
      <div className="flex-auto max-w-screen-lg rounded-lg space-y-3 text-gray-700 bg-white p-5 m-5">
        <Form.SimpleForm
          errorMessage={
            errorMessage !== null
              ? t('project.createError', { message: errorMessage })
              : null
          }
          onCancel={onCancel}
          onSubmit={onSubmit}
          ready={isReady}
          saving={isSaving}>
          <Form.Field
            title={t('project.namespace')}
            name="namespace_id"
            description={t('project.create.namespaceDescription')}
            value={fieldValues.namespace_id}
            errorMessage={fieldErrors.namespace_id}
            type="select"
            autoFocus={true}
            castTo="number"
            required={true}
            options={metadataAsOptions(globalState.metadata.namespaces)}
            onChange={onChange}
          />
          <Form.Field
            title={t('project.projectType')}
            name="project_type_id"
            description={t('project.create.projectTypeDescription')}
            value={fieldValues.project_type_id}
            errorMessage={fieldErrors.project_type_id}
            type="select"
            castTo="number"
            required={true}
            options={metadataAsOptions(globalState.metadata.projectTypes)}
            onChange={onChange}
          />
          <Form.Field
            title={t('project.name')}
            name="name"
            description={t('project.nameDescription')}
            value={fieldValues.name}
            errorMessage={fieldErrors.name}
            type="text"
            required={true}
            onChange={onChange}
          />
          <Form.Field
            title={t('common.slug')}
            name="slug"
            description={t('common.slugDescription')}
            value={fieldValues.slug}
            errorMessage={fieldErrors.slug}
            type="text"
            required={true}
            onChange={onChange}
          />
          <Form.Field
            title={t('common.description')}
            name="description"
            description={t('project.descriptionDescription')}
            value={fieldValues.description}
            errorMessage={fieldErrors.description}
            type="markdown"
            onChange={onChange}
          />
          <AutomationList
            automations={automations}
            selectedAutomations={selectedAutomations}
            setSelectedAutomations={setSelectedAutomations}
          />
        </Form.SimpleForm>
      </div>
    </ErrorBoundary>
  )
}

export { Create }
