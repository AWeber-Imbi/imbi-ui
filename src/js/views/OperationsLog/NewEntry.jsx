import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { User } from '../../schema'
import { ErrorBoundary, Form, SavingModal } from '../../components'
import { useTranslation } from 'react-i18next'
import { metadataAsOptions } from '../../settings'
import { httpPost, ISO8601ToDatetimeLocal } from '../../utils'
import { useNavigate } from 'react-router-dom'
import { Error } from '../Error'
import { jsonSchema } from '../../schema/OperationsLog'
import { useValidation } from '../../components/Form/validate'

function NewEntry({ user }) {
  const [globalState, dispatch] = useContext(Context)
  const [saving, setSaving] = useState(false)
  const [savingComplete, setSavingComplete] = useState(false)
  const [error, setError] = useState()
  const [errors, validate] = useValidation('operationsLog', jsonSchema)
  const [fields, setFields] = useState({
    change_type: null,
    environment: null,
    recorded_at: ISO8601ToDatetimeLocal(new Date().toISOString()).slice(0, -7),
    completed_at: null,
    description: '',
    project: null,
    version: '',
    ticket_slug: '',
    link: '',
    notes: ''
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

  function values() {
    return {
      recorded_by: user.username,
      environment: fields.environment,
      change_type: fields.change_type,
      recorded_at: new Date(fields.recorded_at).toISOString(),
      completed_at: fields.completed_at
        ? new Date(fields.completed_at).toISOString()
        : null,
      project_id: fields.project ? parseInt(fields.project) : null,
      description: fields.description ? fields.description : null,
      link: fields.link ? fields.link : null,
      notes: fields.notes ? fields.notes : null,
      ticket_slug: fields.ticket_slug ? fields.ticket_slug : null,
      version: fields.version ? fields.version : null
    }
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
          !fields.recorded_at ||
          !fields.description
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
          title={t('operationsLog.changeType')}
          name="change_type"
          type="select"
          options={globalState.metadata.changeTypes.map((changeType) => ({
            label: changeType,
            value: changeType
          }))}
          required={true}
          onChange={onChange}
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
          errorMessage={errors.environment}
        />
        <Form.Field
          title={t('operationsLog.recordedAt')}
          name="recorded_at"
          type="datetime"
          required={true}
          onChange={onChange}
          value={fields.recorded_at}
          errorMessage={errors.recorded_at}
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
