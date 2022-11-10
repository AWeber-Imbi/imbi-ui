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
  const navigate = useNavigate()

  const [changeType, setChangeType] = useState()
  const [environment, setEnvironment] = useState()
  const [recordedAt, setRecordedAt] = useState()
  const [completedAt, setCompletedAt] = useState()
  const [description, setDescription] = useState('')
  const [project, setProject] = useState()
  const [version, setVersion] = useState('')
  const [ticketSlug, setTicketSlug] = useState('')
  const [link, setLink] = useState('')
  const [notes, setNotes] = useState('')

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
        environment: environment,
        change_type: changeType,
        recorded_at: new Date(recordedAt).toISOString(),
        completed_at: completedAt ? new Date(completedAt).toISOString() : null,
        project_id: project ? parseInt(project) : null,
        description: description ? description : null,
        link: link ? link : null,
        notes: notes ? notes : null,
        ticket_slug: ticketSlug ? ticketSlug : null,
        version: version ? version : null
      }
    )
    if (response.success) {
      setSavingComplete(true)
    } else {
      setError(response.data)
    }
  }

  return (
    <ErrorBoundary>
      <Form.MultiSectionForm
        disabled={!changeType || !environment || !recordedAt}
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
          onChange={(_name, value) => setChangeType(value)}
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
          onChange={(_name, value) => setEnvironment(value)}
        />
        <Form.Field
          title={t('operationsLog.recordedAt')}
          name="link"
          type="datetime"
          required={true}
          onChange={(_name, value) => setRecordedAt(value)}
        />
        <Form.Field
          title={t('operationsLog.completedAt')}
          name="link"
          type="datetime"
          required={false}
          description={t('operationsLog.completedAtDescription')}
          onChange={(_name, value) => setCompletedAt(value)}
        />
        <Form.Field
          title={t('operationsLog.description')}
          name="description"
          type="text"
          required={false}
          description={t('operationsLog.descriptionDescription')}
          onChange={(_name, value) => setDescription(value)}
          value={description}
        />
        <Form.Field
          title={t('operationsLog.project')}
          name="project"
          type="project"
          required={false}
          onChange={(_name, value) => setProject(value)}
          onError={(error) => setError(error)}
        />
        <Form.Field
          title={t('operationsLog.version')}
          name="version"
          type="text"
          required={false}
          description={t('operationsLog.versionDescription')}
          onChange={(_name, value) => setVersion(value)}
          value={version}
        />
        <Form.Field
          title={t('operationsLog.ticketSlug')}
          name="ticket_slug"
          type="text"
          required={false}
          onChange={(_name, value) => setTicketSlug(value)}
          value={ticketSlug}
        />
        <Form.Field
          title={t('operationsLog.link')}
          name="link"
          type="text"
          required={false}
          description={t('operationsLog.linkDescription')}
          onChange={(_name, value) => setLink(value)}
          value={link}
        />
        <Form.Field
          title={t('operationsLog.notes')}
          name="notes"
          type="markdown"
          required={false}
          description={t('operationsLog.notesDescription')}
          onChange={(_name, value) => setNotes(value)}
          value={notes}
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
