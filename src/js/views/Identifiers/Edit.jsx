import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { ErrorBoundary, Form } from '../../components'
import { httpPatch, ISO8601ToDatetimeLocal } from '../../utils'
import { Context } from '../../state'
import { useTranslation } from 'react-i18next'

function Edit({ integrations, entry, onError, onCancel, onSuccess }) {
  const { t } = useTranslation()
  const [globalState] = useContext(Context)
  const [fieldValues, setFieldValues] = useState()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const values = {
      ...entry,
      created_at: ISO8601ToDatetimeLocal(entry.created_at),
      last_modified_at: entry.last_modified_at
        ? ISO8601ToDatetimeLocal(entry.last_modified_at)
        : entry.last_modified_at
    }
    setFieldValues(values)
  }, [])

  useEffect(() => {
    if (!saving) return

    let changes = []
    if (fieldValues.external_id !== entry.external_id) {
      changes = changes.concat([
        {
          op: 'replace',
          path: '/external_id',
          value: fieldValues.external_id
        }
      ])
    }
    if (fieldValues.integration_name !== entry.integration_name) {
      changes = changes.concat([
        {
          op: 'replace',
          path: '/integration_name',
          value: fieldValues.integration_name
        }
      ])
    }
    if (changes.length === 0) {
      setSaving(false)
      onSuccess()
      return
    }

    const update = async () => {
      const response = await httpPatch(
        globalState.fetch,
        new URL(
          `/projects/${entry.project_id}/identifiers/${entry.integration_name}`,
          globalState.baseURL
        ),
        changes
      )
      if (response.success) {
        setSaving(false)
        onSuccess()
      } else {
        onError(response.data)
      }
    }
    update().catch((error) => onError(error))
  }, [saving])

  function onValueChange(key, value) {
    setFieldValues((prevState) => ({
      ...prevState,
      [key]: value
    }))
  }

  if (!fieldValues) return <></>
  return (
    <ErrorBoundary>
      <Form.SimpleForm
        errorMessage={null}
        onCancel={onCancel}
        onSubmit={() => {
          setSaving(true)
        }}
        ready={true}
        saving={saving}>
        <Form.Field
          title={t('project.identifiers.columns.owner')}
          name="integration_name"
          type="select"
          options={integrations.map((name) => ({ label: name, value: name }))}
          value={fieldValues.integration_name}
          required={true}
          onChange={onValueChange}
        />
        <Form.Field
          title={t('project.identifiers.columns.externalId')}
          name="external_id"
          type="text"
          value={fieldValues.external_id}
          required={true}
          onChange={onValueChange}
        />
      </Form.SimpleForm>
    </ErrorBoundary>
  )
}
Edit.propTypes = {
  integrations: PropTypes.arrayOf(PropTypes.string).isRequired,
  entry: PropTypes.object.isRequired,
  onError: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
}
export { Edit }
