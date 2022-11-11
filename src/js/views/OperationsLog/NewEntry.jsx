import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { User } from '../../schema'
import { ErrorBoundary, Form, SavingModal } from '../../components'
import { useTranslation } from 'react-i18next'
import { metadataAsOptions } from '../../settings'
import { httpPost } from '../../utils'
import { useNavigate } from 'react-router-dom'
import { Error } from '../Error'
import { validate } from 'jsonschema'
import { jsonSchema } from '../../schema/OperationsLog'

function NewEntry({ user }) {
  const [globalState, dispatch] = useContext(Context)
  const [saving, setSaving] = useState(false)
  const [savingComplete, setSavingComplete] = useState(false)
  const [error, setError] = useState()
  const [fields, setFields] = useState({
    change_type: {
      value: null,
      validationError: null
    },
    environment: {
      value: null,
      validationError: null
    },
    recorded_at: {
      value: null,
      validationError: null
    },
    completed_at: {
      value: null,
      validationError: null
    },
    description: {
      value: '',
      validationError: null
    },
    project: {
      value: null,
      validationError: null
    },
    version: {
      value: '',
      validationError: null
    },
    ticket_slug: {
      value: '',
      validationError: null
    },
    link: {
      value: '',
      validationError: null
    },
    notes: {
      value: '',
      validationError: null
    }
  })
  const navigate = useNavigate()

  const { t } = useTranslation()

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'operationsLog.create.title',
        url: new URL('/ui/operations-log/create', globalState.baseURL)
      }
    })
  }, [])

  function errorMessages(field) {
    switch (field) {
      case 'change_type':
        return t('operationsLog.validation.changeTypeError')
      case 'environment':
        return t('operationsLog.validation.environmentError')
      case 'recorded_at':
        return t('operationsLog.validation.recordedAtError')
      case 'completed_at':
        return t('operationsLog.validation.completedAtError')
      case 'description':
        return t('operationsLog.validation.descriptionError')
      case 'project':
        return t('operationsLog.validation.projectError')
      case 'version':
        return t('operationsLog.validation.versionError')
      case 'ticket_slug':
        return t('operationsLog.validation.ticketSlugError')
      case 'link':
        return t('operationsLog.validation.linkError')
      case 'notes':
        return t('operationsLog.validation.notesError')
      default:
        return t('error.title')
    }
  }

  function clearValidation() {
    setFields((prevState) => {
      const newState = { ...prevState }
      for (const field of Object.keys(newState)) {
        newState[field].validationError = null
      }
      return newState
    })
  }

  async function onSubmit(event) {
    event.preventDefault()

    const values = {
      recorded_by: user.username,
      environment: fields.environment.value,
      change_type: fields.change_type.value,
      recorded_at: new Date(fields.recorded_at.value).toISOString(),
      completed_at: fields.completed_at.value
        ? new Date(fields.completed_at.value).toISOString()
        : null,
      project_id: fields.project.value ? parseInt(fields.project.value) : null,
      description: fields.description.value ? fields.description.value : null,
      link: fields.link.value ? fields.link.value : null,
      notes: fields.notes.value ? fields.notes.value : null,
      ticket_slug: fields.ticket_slug.value ? fields.ticket_slug.value : null,
      version: fields.version.value ? fields.version.value : null
    }
    clearValidation()
    const validation = validate(values, jsonSchema)
    if (validation.errors.length > 0) {
      setFields((prevState) => {
        const newState = { ...prevState }
        for (const error of validation.errors) {
          for (const path of error.path) {
            newState[path].validationError = errorMessages(path)
          }
        }
        return newState
      })
      return
    }

    setSaving(true)
    const response = await httpPost(
      globalState.fetch,
      new URL('/operations-log', globalState.baseURL),
      values
    )
    if (response.success) {
      setSavingComplete(true)
    } else {
      setError(response.data)
    }
  }

  function onChange(name, value) {
    setFields((prevState) => ({
      ...prevState,
      [name]: { ...prevState[name], value }
    }))
  }

  return (
    <ErrorBoundary>
      <Form.MultiSectionForm
        disabled={
          !fields.change_type.value ||
          !fields.environment.value ||
          !fields.recorded_at.value
        }
        sideBarTitle={t('operationsLog.create.sideBarTitle')}
        icon="fas file"
        onSubmit={onSubmit}
        instructions={
          <div className="ml-2 text-sm">* {t('common.required')}</div>
        }
        submitButtonText={saving ? t('common.saving') : t('common.save')}>
        <Form.Field
          title={t('operationsLog.changeType')}
          name="change_type"
          type="select"
          options={globalState.metadata.changeTypes.map((changeType) => ({
            label: changeType,
            value: changeType
          }))}
          required={true}
          onChange={onChange}
          errorMessage={fields.change_type.validationError}
        />
        <Form.Field
          title={t('operationsLog.environment')}
          name="environment"
          type="select"
          options={metadataAsOptions(
            globalState.metadata.environments,
            'name',
            'name'
          )}
          required={true}
          onChange={onChange}
          errorMessage={fields.environment.validationError}
        />
        <Form.Field
          title={t('operationsLog.recordedAt')}
          name="recorded_at"
          type="datetime"
          required={true}
          onChange={onChange}
          value={fields.recorded_at.value}
          errorMessage={fields.recorded_at.validationError}
        />
        <Form.Field
          title={t('operationsLog.completedAt')}
          name="completed_at"
          type="datetime"
          required={false}
          description={t('operationsLog.completedAtDescription')}
          onChange={onChange}
          value={fields.completed_at.value}
          errorMessage={fields.completed_at.validationError}
        />
        <Form.Field
          title={t('operationsLog.description')}
          name="description"
          type="text"
          required={false}
          description={t('operationsLog.descriptionDescription')}
          onChange={onChange}
          value={fields.description.value}
          errorMessage={fields.description.validationError}
        />
        <Form.Field
          title={t('operationsLog.project')}
          name="project"
          type="project"
          required={false}
          onChange={onChange}
          onError={(error) => setError(error)}
          errorMessage={fields.project.validationError}
        />
        <Form.Field
          title={t('operationsLog.version')}
          name="version"
          type="text"
          required={false}
          description={t('operationsLog.versionDescription')}
          onChange={onChange}
          value={fields.version.value}
          errorMessage={fields.version.validationError}
        />
        <Form.Field
          title={t('operationsLog.ticketSlug')}
          name="ticket_slug"
          type="text"
          required={false}
          onChange={onChange}
          value={fields.ticket_slug.value}
          errorMessage={fields.ticket_slug.validationError}
        />
        <Form.Field
          title={t('operationsLog.link')}
          name="link"
          type="text"
          required={false}
          description={t('operationsLog.linkDescription')}
          onChange={onChange}
          value={fields.link.value}
          errorMessage={fields.link.validationError}
        />
        <Form.Field
          title={t('operationsLog.notes')}
          name="notes"
          type="markdown"
          required={false}
          description={t('operationsLog.notesDescription')}
          onChange={onChange}
          value={fields.notes.value}
          errorMessage={fields.notes.validationError}
        />
      </Form.MultiSectionForm>
      {saving && (
        <SavingModal
          title={t('operationsLog.savingNewEntryTitle')}
          steps={[
            {
              isComplete: savingComplete,
              pendingLabel: t('operationsLog.savingNewEntry'),
              completedLabel: t('operationsLog.savingNewEntryComplete')
            }
          ]}
          onSaveComplete={(event) => {
            event.preventDefault()
            navigate('/ui/operations-log')
          }}
        />
      )}
      {error && <Error>{error}</Error>}
    </ErrorBoundary>
  )
}
NewEntry.propTypes = {
  user: PropTypes.exact(User)
}
export { NewEntry }
