import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { Form } from '../../components'
import { metadataAsOptions } from '../../settings'
import { useTranslation } from 'react-i18next'
import { httpGet, httpPatch, ISO8601ToDatetimeLocal } from '../../utils'
import { compare } from 'fast-json-patch'

function Edit({ onCancel, onError, onSuccess, saving, operationsLog }) {
  const [globalState] = useContext(Context)
  const [fieldValues, setFieldValues] = useState()
  const { t } = useTranslation()

  useEffect(() => {
    const values = {
      ...operationsLog,
      recorded_at: ISO8601ToDatetimeLocal(operationsLog.recorded_at),
      completed_at: operationsLog.completed_at
        ? ISO8601ToDatetimeLocal(operationsLog.completed_at)
        : operationsLog.completed_at
    }

    if (operationsLog.project_id) {
      httpGet(
        globalState.fetch,
        new URL(`/projects/${operationsLog.project_id}`, globalState.baseURL),
        (data) => {
          values.project = {
            project_id: data.id,
            namespace_id: data.namespace_id,
            project_type_id: data.project_type_id
          }
          setFieldValues(values)
        },
        (error) => onError(error)
      )
    } else {
      setFieldValues(values)
    }
  }, [])

  async function onSubmit() {
    const url = new URL(
      `/operations-log/${operationsLog.id}`,
      globalState.baseURL
    )
    const newValues = {
      ...fieldValues,
      recorded_at: new Date(fieldValues.recorded_at).toISOString(),
      completed_at: fieldValues.completed_at
        ? new Date(fieldValues.completed_at).toISOString()
        : null,
      project_id: fieldValues.project_id ? fieldValues.project_id : null
    }
    delete newValues.project
    const oldValues = {
      ...operationsLog,
      recorded_at: new Date(operationsLog.recorded_at).toISOString(),
      completed_at: operationsLog.completed_at
        ? new Date(operationsLog.completed_at).toISOString()
        : null
    }

    const patchValue = compare(oldValues, newValues)
    if (patchValue.length === 0) {
      onCancel()
      return
    }
    const response = await httpPatch(globalState.fetch, url, patchValue)
    if (response.success) {
      onSuccess()
    } else {
      onError(response.data)
    }
  }

  function onValueChange(key, value) {
    setFieldValues((prevValues) => {
      const newValues = { ...prevValues }
      if (key === 'project') {
        delete newValues.project
        newValues.project_id = value
      } else {
        newValues[key] = value
      }
      return newValues
    })
  }

  if (!fieldValues) return <></>

  return (
    <Form.SimpleForm
      errorMessage={null}
      onCancel={onCancel}
      onSubmit={onSubmit}
      ready={true}
      saving={saving}>
      <Form.Field
        title={t('operationsLog.changeType')}
        name="change_type"
        type="select"
        options={[
          { label: 'Configured', value: 'Configured' },
          { label: 'Decommissioned', value: 'Decommissioned' },
          { label: 'Deployed', value: 'Deployed' },
          { label: 'Migrated', value: 'Migrated' },
          { label: 'Provisioned', value: 'Provisioned' },
          { label: 'Restarted', value: 'Restarted' },
          { label: 'Rolled Back', value: 'Rolled Back' },
          { label: 'Scaled', value: 'Scaled' },
          { label: 'Upgraded', value: 'Upgraded' }
        ]}
        required={true}
        onChange={onValueChange}
        value={fieldValues.change_type}
        className="text-gray-600"
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
        onChange={onValueChange}
        value={fieldValues.environment}
        className="text-gray-600"
      />
      <Form.Field
        title={t('operationsLog.recordedAt')}
        name="recorded_at"
        type="datetime"
        required={true}
        onChange={onValueChange}
        value={fieldValues.recorded_at}
        className="text-gray-600"
      />
      <Form.Field
        title={t('operationsLog.completedAt')}
        name="completed_at"
        type="datetime"
        required={false}
        description={t('operationsLog.completedAtDescription')}
        onChange={onValueChange}
        value={fieldValues.completed_at}
        className="text-gray-600"
      />
      <Form.Field
        title={t('operationsLog.description')}
        name="description"
        type="text"
        required={false}
        description={t('operationsLog.descriptionDescription')}
        onChange={onValueChange}
        value={fieldValues.description}
        className="text-gray-600"
      />
      <Form.Field
        title={t('operationsLog.project')}
        name="project"
        type="project"
        required={false}
        onChange={onValueChange}
        onError={onError}
        value={fieldValues.project}
        className="text-gray-600"
      />
      <Form.Field
        title={t('operationsLog.version')}
        name="version"
        type="text"
        required={false}
        description={t('operationsLog.versionDescription')}
        onChange={onValueChange}
        value={fieldValues.version}
        className="text-gray-600"
      />
      <Form.Field
        title={t('operationsLog.ticketSlug')}
        name="ticket_slug"
        type="text"
        required={false}
        onChange={onValueChange}
        value={fieldValues.ticket_slug}
        className="text-gray-600"
      />
      <Form.Field
        title={t('operationsLog.link')}
        name="link"
        type="text"
        required={false}
        description={t('operationsLog.linkDescription')}
        onChange={onValueChange}
        value={fieldValues.link}
        className="text-gray-600"
      />
      <Form.Field
        title={t('operationsLog.notes')}
        name="notes"
        type="markdown"
        required={false}
        description={t('operationsLog.notesDescription')}
        onChange={onValueChange}
        value={fieldValues.notes}
        className="text-gray-600"
      />
    </Form.SimpleForm>
  )
}
Edit.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  operationsLog: PropTypes.object.isRequired
}
export { Edit }
