import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { User } from '../../schema'
import { ErrorBoundary, Form, SavingModal } from '../../components'
import { useTranslation } from 'react-i18next'
import { metadataAsOptions } from '../../settings'
import { httpPost, ISO8601ToDatetimeLocal } from '../../utils'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Error } from '../Error'
import { jsonSchema } from '../../schema/OperationsLog'
import { useValidation } from '../../components/Form/validate'

export function normalizeTicketSlug(ticketSlug) {
  if (ticketSlug) {
    return ticketSlug
      .split(/[,\s]+/)
      .join(',')
      .replace(/[,\s]+$/, '')
  }
  return null
}

function NewEntry({ user }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [globalState, dispatch] = useContext(Context)
  const [saving, setSaving] = useState(false)
  const [savingComplete, setSavingComplete] = useState(false)
  const [error, setError] = useState()
  const [errors, validate] = useValidation('operationsLog', jsonSchema)
  const [fields, setFields] = useState({
    change_type: params.get('change_type'),
    environment: params.get('environment'),
    occurred_at: ISO8601ToDatetimeLocal(new Date().toISOString()).slice(0, -7),
    completed_at: null,
    description: params.get('description') || '',
    performed_by: params.get('performed_by') || user.username,
    project:
      params.has('namespace_id') ||
      params.has('project_id') ||
      params.has('project_type_id')
        ? {
            namespace_id: params.has('namespace_id')
              ? parseInt(params.get('namespace_id'))
              : null,
            project_id: params.has('project_id')
              ? parseInt(params.get('project_id'))
              : null,
            project_type_id: params.has('project_type_id')
              ? parseInt(params.get('project_type_id'))
              : null
          }
        : null,
    version: params.get('version') || '',
    ticket_slug: params.get('ticket_slug') || '',
    link: params.get('link') || '',
    notes: params.get('notes') || ''
  })

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
  useEffect(() => {
    const parsedFields = {}
    for (const dateField of ['occurred_at', 'completed_at']) {
      try {
        if (params.has(dateField)) {
          parsedFields[dateField] = ISO8601ToDatetimeLocal(
            params.get(dateField)
          )
        }
      } catch (error) {
        console.log(`Ignoring ${dateField} parameter: ${error.message} `)
      }
    }
    setFields((curr) => ({ ...curr, ...parsedFields }))
  }, [])

  function values() {
    const fieldValues = {
      environment: fields.environment,
      change_type: fields.change_type,
      occurred_at: new Date(fields.occurred_at).toISOString(),
      completed_at: fields.completed_at
        ? new Date(fields.completed_at).toISOString()
        : null,
      project_id: fields.project ? fields.project.project_id : null,
      description: fields.description ? fields.description : null,
      link: fields.link ? fields.link : null,
      notes: fields.notes ? fields.notes : null,
      ticket_slug: normalizeTicketSlug(fields.ticket_slug),
      version: fields.version ? fields.version : null
    }
    // only include performed_by when it differs from current user
    // nothing depends on this ... but searching for documents in the
    // index with the field set is possible (eg, NOT performed_by:*)
    // whereas it is not possible to find documents where performed_by
    // is different from recorded_by :p
    if (fields.performed_by !== user.username) {
      fieldValues.performed_by = fields.performed_by
    }
    return fieldValues
  }

  useEffect(() => {
    if (!saving) return

    if (Object.keys(errors).length > 0) {
      setSaving(false)
      return
    }

    const create = async () => {
      const response = await httpPost(
        globalState.fetch,
        new URL('/operations-log', globalState.baseURL),
        values()
      )
      if (response.success) {
        setSavingComplete(true)
      } else {
        setError(response.data)
      }
    }

    create().catch((error) => setError(error))
  }, [saving])

  function onChange(name, value) {
    setFields((prevState) => ({
      ...prevState,
      [name]: value
    }))
  }

  return (
    <ErrorBoundary>
      <Form.MultiSectionForm
        disabled={
          !fields.change_type ||
          !fields.environment ||
          !fields.occurred_at ||
          !fields.description ||
          !fields.performed_by
        }
        sideBarTitle={t('operationsLog.create.sideBarTitle')}
        icon="fas file"
        onSubmit={(event) => {
          event.preventDefault()
          validate(values())
          setSaving(true)
        }}
        instructions={
          <div className="ml-2 text-sm">* {t('common.required')}</div>
        }
        submitButtonText={saving ? t('common.saving') : t('common.save')}>
        <Form.Field
          title={t('operationsLog.performedBy')}
          name="performed_by"
          type="text"
          required={true}
          onChange={onChange}
          errorMessage={errors.performed_by}
          value={fields.performed_by}
        />
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
          value={fields.change_type}
          errorMessage={errors.change_type}
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
          value={fields.environment}
          errorMessage={errors.environment}
        />
        <Form.Field
          title={t('operationsLog.occurredAt')}
          name="occurred_at"
          type="datetime"
          required={true}
          onChange={onChange}
          value={fields.occurred_at}
          errorMessage={errors.occurred_at}
        />
        <Form.Field
          title={t('operationsLog.completedAt')}
          name="completed_at"
          type="datetime"
          required={false}
          description={t('operationsLog.completedAtDescription')}
          onChange={onChange}
          value={fields.completed_at}
          errorMessage={errors.completed_at}
        />
        <Form.Field
          title={t('operationsLog.description')}
          name="description"
          type="text"
          required={true}
          description={t('operationsLog.descriptionDescription')}
          onChange={onChange}
          value={fields.description}
          errorMessage={errors.description}
        />
        <Form.Field
          title={t('operationsLog.project')}
          name="project"
          type="project"
          required={false}
          onChange={onChange}
          value={fields.project}
          onError={(error) => setError(error)}
          errorMessage={errors.project}
        />
        <Form.Field
          title={t('operationsLog.version')}
          name="version"
          type="text"
          required={false}
          description={t('operationsLog.versionDescription')}
          onChange={onChange}
          value={fields.version}
          errorMessage={errors.version}
        />
        <Form.Field
          title={t('operationsLog.ticketSlug')}
          name="ticket_slug"
          type="text"
          required={false}
          onChange={onChange}
          value={fields.ticket_slug}
          errorMessage={errors.ticket_slug}
        />
        <Form.Field
          title={t('operationsLog.link')}
          name="link"
          type="text"
          required={false}
          description={t('operationsLog.linkDescription')}
          onChange={onChange}
          value={fields.link}
          errorMessage={errors.link}
        />
        <Form.Field
          title={t('operationsLog.notes')}
          name="notes"
          type="markdown"
          required={false}
          description={t('operationsLog.notesDescription')}
          onChange={onChange}
          value={fields.notes}
          errorMessage={errors.notes}
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
            navigate(
              params.has('returnTo')
                ? params.get('returnTo')
                : '/ui/operations-log'
            )
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
