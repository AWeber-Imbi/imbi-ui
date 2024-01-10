import { ErrorBoundary, Form } from '../../components'
import React, { useContext, useEffect, useState } from 'react'
import { httpPost } from '../../utils'
import { Context } from '../../state'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

function NewIdentifier({ integrations, onCancel, onSuccess, projectId }) {
  const [globalState] = useContext(Context)
  const { t } = useTranslation()
  const [fields, setFields] = useState({
    integration_name: null,
    external_id: null
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!saving) return

    const create = async () => {
      const response = await httpPost(
        globalState.fetch,
        new URL(`/projects/${projectId}/identifiers`, globalState.baseURL),
        {
          integration_name: fields.integration_name,
          external_id: fields.external_id
        }
      )
      if (response.success) {
        onSuccess(response.data)
      } else {
        setError(response.data)
        setSaving(false)
      }
    }
    create().catch((error) => {
      setError(error.toString())
    })
  }, [saving])

  function onValueChange(key, value) {
    setFields((prevState) => ({
      ...prevState,
      [key]: value
    }))
  }

  return (
    <ErrorBoundary>
      <Form.SimpleForm
        errorMessage={error}
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
          value={integrations[0]}
          options={integrations.map((name) => ({ label: name, value: name }))}
          onChange={onValueChange}
        />
        <Form.Field
          title={t('project.identifiers.columns.externalId')}
          name="external_id"
          type="text"
          value={fields.external_id}
          onChange={onValueChange}
        />
      </Form.SimpleForm>
    </ErrorBoundary>
  )
}
NewIdentifier.propTypes = {
  integrations: PropTypes.arrayOf(PropTypes.string).isRequired,
  projectId: PropTypes.number.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
}
export { NewIdentifier }
