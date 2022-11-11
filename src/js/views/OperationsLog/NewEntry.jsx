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

  async function onSubmit(event) {
    event.preventDefault()
    setSaving(true)
    const response = await httpPost(
      globalState.fetch,
      new URL('/operations-log', globalState.baseURL),
      {
        recorded_by: user.username,
        environment: fields.environment.value,
        change_type: fields.change_type.value,
        recorded_at: new Date(fields.recorded_at.value).toISOString(),
        completed_at: fields.completed_at.value
          ? new Date(fields.completed_at.value).toISOString()
          : null,
        project_id: fields.project.value
          ? parseInt(fields.project.value)
          : null,
        description: fields.description.value ? fields.description.value : null,
        link: fields.link.value ? fields.link.value : null,
        notes: fields.notes.value ? fields.notes.value : null,
        ticket_slug: fields.ticket_slug.value ? fields.ticket_slug.value : null,
        version: fields.version.value ? fields.version.value : null
      }
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
        />
        <Form.Field
          title={t('operationsLog.recordedAt')}
          name="recorded_at"
          type="datetime"
          required={true}
          onChange={onChange}
          value={fields.recorded_at.value}
        />
        <Form.Field
          title={t('operationsLog.completedAt')}
          name="completed_at"
          type="datetime"
          required={false}
          description={t('operationsLog.completedAtDescription')}
          onChange={onChange}
          value={fields.completed_at.value}
        />
        <Form.Field
          title={t('operationsLog.description')}
          name="description"
          type="text"
          required={false}
          description={t('operationsLog.descriptionDescription')}
          onChange={onChange}
          value={fields.description.value}
        />
        <Form.Field
          title={t('operationsLog.project')}
          name="project"
          type="project"
          required={false}
          onChange={onChange}
          onError={(error) => setError(error)}
        />
        <Form.Field
          title={t('operationsLog.version')}
          name="version"
          type="text"
          required={false}
          description={t('operationsLog.versionDescription')}
          onChange={onChange}
          value={fields.version.value}
        />
        <Form.Field
          title={t('operationsLog.ticketSlug')}
          name="ticket_slug"
          type="text"
          required={false}
          onChange={onChange}
          value={fields.ticket_slug.value}
        />
        <Form.Field
          title={t('operationsLog.link')}
          name="link"
          type="text"
          required={false}
          description={t('operationsLog.linkDescription')}
          onChange={onChange}
          value={fields.link.value}
        />
        <Form.Field
          title={t('operationsLog.notes')}
          name="notes"
          type="markdown"
          required={false}
          description={t('operationsLog.notesDescription')}
          onChange={onChange}
          value={fields.notes.value}
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
