import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { Form } from '../../components'
import { metadataAsOptions } from '../../settings'
import { useTranslation } from 'react-i18next'
import { httpGet, httpPatch, ISO8601ToDatetimeLocal } from '../../utils'
import { compare } from 'fast-json-patch'
import { jsonSchema } from '../../schema/OperationsLog'
import { useValidation } from '../../components/Form/validate'
import { normalizeTicketSlug } from './NewEntry'

function toSchemaValues(fieldValues) {
  const values = {
    ...fieldValues,
    occurred_at: new Date(fieldValues.occurred_at).toISOString(),
    completed_at: fieldValues.completed_at
      ? new Date(fieldValues.completed_at).toISOString()
      : null,
    description: fieldValues.description
      ? fieldValues.description.trim()
      : null,
    performed_by: fieldValues.performed_by
      ? fieldValues.performed_by.trim()
      : null,
    project_id: fieldValues.project.project_id
      ? parseInt(fieldValues.project.project_id.trim())
      : null,
    ticket_slug: normalizeTicketSlug(fieldValues.ticket_slug),
    link: fieldValues.link ? fieldValues.link.trim() : null,
    notes: fieldValues.notes ? fieldValues.notes.trim() : null
  }
  delete values.project
  return values
}

function Edit({ onCancel, onError, onSuccess, operationsLog }) {
  const [globalState] = useContext(Context)
  const [fieldValues, setFieldValues] = useState()
  const [errors, validate] = useValidation('operationsLog', jsonSchema)
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const values = {
      ...operationsLog,
      occurred_at: ISO8601ToDatetimeLocal(operationsLog.occurred_at),
      completed_at: operationsLog.completed_at
        ? ISO8601ToDatetimeLocal(operationsLog.completed_at)
        : operationsLog.completed_at
    }

    if (operationsLog.project_id) {
      httpGet(
        globalState.fetch,
        new URL(`/projects/${operationsLog.project_id}`, globalState.baseURL),
        ({ data }) => {
          values.project = {
            project_id: data.id.toString(),
            namespace_id: data.namespace_id.toString(),
            project_type_id: data.project_type_id.toString()
          }
          delete values.project_id
          setFieldValues(values)
        },
        ({ message }) => onError(message)
      )
    } else {
      values.project = { project_id: '', namespace_id: '', project_type_id: '' }
      setFieldValues(values)
    }
  }, [])

  useEffect(() => {
    if (!saving) return

    if (Object.keys(errors).length > 0) {
      setSaving(false)
      return
    }

    const update = async () => {
      const oldValues = {
        ...operationsLog,
        occurred_at: new Date(operationsLog.occurred_at).toISOString(),
        completed_at: operationsLog.completed_at
          ? new Date(operationsLog.completed_at).toISOString()
          : null
      }

      const patchValue = compare(oldValues, toSchemaValues(fieldValues))
      if (patchValue.length === 0) {
        onCancel()
        return
      }
      const url = new URL(
        `/operations-log/${operationsLog.id}`,
        globalState.baseURL
      )
      const response = await httpPatch(globalState.fetch, url, patchValue)
      setSaving(false)
      if (response.success) {
        onSuccess()
      } else {
        onError(response.data)
      }
    }

    update().catch((error) => onError(error))
  }, [saving])

  function onValueChange(key, value) {
    setFieldValues((prevValues) => ({
      ...prevValues,
      [key]: key === 'project' ? { project_id: value } : value
    }))
  }

  if (!fieldValues) return <></>

  return (
    <Form.SimpleForm
      errorMessage={null}
      onCancel={onCancel}
      onSubmit={() => {
        validate(toSchemaValues(fieldValues))
        setSaving(true)
      }}
      ready={true}
      saving={saving}>
      <Form.Field
        title={t('operationsLog.changeType')}
        name="change_type"
        type="select"
        options={globalState.metadata.changeTypes.map((changeType) => ({
          label: changeType,
          value: changeType
        }))}
        required={true}
        onChange={onValueChange}
        value={fieldValues.change_type}
        className="text-gray-600"
        errorMessage={errors?.change_type}
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
        errorMessage={errors?.environment}
      />
      <Form.Field
        title={t('operationsLog.performedBy')}
        name="performed_by"
        type="text"
        required={true}
        description={t('operationsLog.performedByDescription')}
        onChange={onValueChange}
        value={fieldValues.performed_by || fieldValues.recorded_by}
        className="text-gray-600"
        errorMessage={errors?.performed_by}
      />
      <Form.Field
        title={t('operationsLog.occurredAt')}
        name="occurred_at"
        type="datetime"
        required={true}
        onChange={onValueChange}
        value={fieldValues.occurred_at}
        className="text-gray-600"
        errorMessage={errors?.occurred_at}
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
        errorMessage={errors?.completed_at}
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
        errorMessage={errors?.description}
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
        errorMessage={errors?.project}
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
        errorMessage={errors?.version}
      />
      <Form.Field
        title={t('operationsLog.ticketSlug')}
        name="ticket_slug"
        type="text"
        required={false}
        onChange={onValueChange}
        value={fieldValues.ticket_slug}
        className="text-gray-600"
        errorMessage={errors?.ticket_slug}
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
        errorMessage={errors?.link}
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
        errorMessage={errors?.notes}
      />
    </Form.SimpleForm>
  )
}
Edit.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  operationsLog: PropTypes.object.isRequired
}
export { Edit }
