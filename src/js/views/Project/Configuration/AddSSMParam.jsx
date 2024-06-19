import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { ErrorBoundary, Form, SavingModal } from '../../../components'
import { useTranslation } from 'react-i18next'
import { httpPost } from '../../../utils'
import { Context } from '../../../state'
import { Error } from '../../Error'

function AddSSMParam({ onClose, project, pathPrefix }) {
  const [globalState] = useContext(Context)
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [savingComplete, setSavingComplete] = useState(false)
  const [error, setError] = useState()
  const [name, setName] = useState('')
  const [type, setType] = useState()
  const [values, setValues] = useState(
    Object.fromEntries(
      project.environments.map((environment) => [environment, null])
    )
  )

  const disabled =
    !name ||
    !type ||
    Object.values(values).every((value) => !value || value.trim() === '')

  useEffect(() => {
    if (!saving) return

    const data = Object.entries(values)
      .filter(([key, value]) => !!value)
      .map(([key, value]) => ({
        environment: key,
        value
      }))

    const create = async () => {
      const response = await httpPost(
        globalState.fetch,
        new URL(
          `/projects/${project.id}/configuration/ssm`,
          globalState.baseURL
        ),
        {
          namespace_id: project.namespace_id,
          name,
          type,
          values: data
        }
      )
      if (response.success) {
        setSavingComplete(true)
      } else {
        setError(response.data)
      }
    }

    create().catch((error) => {
      setError(error)
    })
  }, [saving])

  return (
    <ErrorBoundary>
      <Form.MultiSectionForm
        sideBarTitle="Add New Parameter"
        errorMessage={null}
        disabled={disabled}
        onSubmit={(event) => {
          event.preventDefault()
          setSaving(true)
        }}
        onCancel={onClose}
        submitButtonText={t('common.save')}>
        <Form.Section name="parameter" title="Parameter">
          <Form.Field
            title={'Name'}
            name="name"
            type="prefix-text"
            required={true}
            onChange={(name, value) => setName(value)}
            value={name}
            prefix={pathPrefix}
          />
          <Form.Field
            title={'Type'}
            name="type"
            type="select"
            options={[
              { label: 'String', value: 'String' },
              { label: 'SecureString', value: 'SecureString' },
              { label: 'StringList', value: 'StringList' }
            ]}
            required={true}
            onChange={(name, value) => setType(value)}
            value={type}
          />
        </Form.Section>
        <Form.Section name="values" title="Values">
          {project.environments.map((environment) => (
            <Form.Field
              key={environment}
              title={environment}
              name={environment}
              type="textarea"
              required={false}
              onChange={(name, value) =>
                setValues((prevState) => ({
                  ...prevState,
                  [name]: value ? value : null
                }))
              }
              value={values[environment]}
            />
          ))}
        </Form.Section>
      </Form.MultiSectionForm>
      {saving && (
        <SavingModal
          title={t('common.save')}
          steps={[
            {
              isComplete: savingComplete,
              pendingLabel: t('project.configuration.ssm.saving'),
              completedLabel: t('project.configuration.ssm.savingComplete')
            }
          ]}
          onSaveComplete={(event) => {
            event.preventDefault()
            onClose()
          }}
        />
      )}
      {error && <Error>{error}</Error>}
    </ErrorBoundary>
  )
}

AddSSMParam.propTypes = {
  onClose: PropTypes.func.isRequired,
  project: PropTypes.object.isRequired,
  pathPrefix: PropTypes.string.isRequired
}

export { AddSSMParam }
