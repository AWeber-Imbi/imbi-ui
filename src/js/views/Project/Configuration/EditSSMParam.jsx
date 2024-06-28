import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { Form } from '../../../components'
import { compare } from 'fast-json-patch'
import { Trans, useTranslation } from 'react-i18next'
import { httpDelete, httpPatch, httpPost } from '../../../utils'
import { Context } from '../../../state'

function EditSSMParam({
  param,
  project,
  pathPrefix,
  onCancel,
  onError,
  onSuccess
}) {
  const [globalState] = useContext(Context)
  const { t, i18n } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(param.name.replace(pathPrefix, ''))
  const [values, setValues] = useState(
    Object.fromEntries(
      project.environments.map((environment) => [
        environment,
        {
          value: param.values[environment]?.value,
          type: param.values[environment]?.type
        }
      ])
    )
  )

  function deleteThenPost(nameSuffix) {
    const createParams = async (onSuccess) => {
      const newValues = {}
      for (const [environment, { type, value }] of Object.entries(values)) {
        if (value) {
          newValues[environment] = { type, value }
        }
      }
      const response = await httpPost(
        globalState.fetch,
        new URL(
          `/projects/${project.id}/configuration/ssm`,
          globalState.baseURL
        ),
        {
          name,
          values: newValues
        }
      )
      if (!response.success) {
        setSaving(false)
        onError(
          response?.responseBody?.detail
            ? response.responseBody.detail
            : response.data
        )
      } else {
        onSuccess()
      }
    }

    const deleteParams = async (onSuccess) => {
      setSaving(true)
      const deleteEnvironments = []
      for (const [environment, { value }] of Object.entries(param.values)) {
        if (value) {
          deleteEnvironments.push(environment)
        }
      }
      const response = await httpDelete(
        globalState.fetch,
        new URL(
          `/projects/${project.id}/configuration/ssm`,
          globalState.baseURL
        ),
        {
          name: nameSuffix,
          environments: deleteEnvironments
        }
      )
      if (!response.success) {
        setSaving(false)
        onError(
          response?.responseBody?.detail
            ? response.responseBody.detail
            : response.data
        )
      } else {
        onSuccess()
      }
    }

    deleteParams(() => {
      createParams(() => onSuccess()).catch((error) => onError(error))
    }).catch((error) => onError(error))
  }

  function patchParams(nameSuffix) {
    const oldValues = {}
    for (const [environment, { type, value }] of Object.entries(param.values)) {
      if (value) {
        oldValues[environment] = { type, value }
      }
    }
    const newValues = {}
    for (const [environment, { type, value }] of Object.entries(values)) {
      if (value) {
        newValues[environment] = { type, value }
      }
    }
    const patch = compare(oldValues, newValues)
    if (patch.length === 0) {
      onSuccess()
      return
    }
    const update = async () => {
      const response = await httpPatch(
        globalState.fetch,
        new URL(
          `/projects/${project.id}/configuration/ssm/${encodeURIComponent(
            nameSuffix
          )}`,
          globalState.baseURL
        ),
        patch
      )
      if (response.success) {
        onSuccess()
      } else {
        onError(
          response?.responseBody?.detail
            ? response.responseBody.detail
            : response.data
        )
      }
    }
    update().catch((error) => onError(error))
  }

  useEffect(() => {
    if (!saving) return

    const nameSuffix = param.name.replace(pathPrefix, '')
    if (name !== nameSuffix) {
      deleteThenPost(nameSuffix)
    } else {
      patchParams(nameSuffix)
    }
  }, [saving])

  const ready =
    !!name &&
    Object.entries(values).filter(
      ([, { type, value }]) => (value && !type) || (type && !value)
    ).length === 0

  return (
    <Form.SimpleForm
      errorMessage={null}
      ready={ready}
      onSubmit={() => {
        setSaving(true)
      }}
      onCancel={onCancel}
      saving={saving}>
      <Form.Section name="parameter" title="Parameter">
        <Form.Field
          title="Name"
          name="name"
          type="prefix-text"
          required={true}
          onChange={(name, value) => setName(value)}
          value={name}
          prefix={pathPrefix}
        />
      </Form.Section>
      <Form.Section name="values" title="Values">
        {project.environments.map((environment) => (
          <React.Fragment key={environment}>
            <Form.Field
              title={
                <Trans
                  i18nKey={'project.configuration.ssm.environmentType'}
                  i18n={i18n}
                  t={t}>
                  {{ environment }}
                </Trans>
              }
              name={`${environment}`}
              type="select"
              options={[
                { label: 'String', value: 'String' },
                { label: 'SecureString', value: 'SecureString' },
                { label: 'StringList', value: 'StringList' }
              ]}
              required={false}
              onChange={(environment, newType) =>
                setValues((prevState) => ({
                  ...prevState,
                  [environment]: {
                    ...prevState[environment],
                    type: newType || null
                  }
                }))
              }
              value={values[environment].type}
            />
            <Form.Field
              title={
                <Trans
                  i18nKey={'project.configuration.ssm.environmentValue'}
                  i18n={i18n}
                  t={t}>
                  {{ environment }}
                </Trans>
              }
              name={environment}
              type="textarea"
              required={false}
              onChange={(environment, newValue) =>
                setValues((prevState) => ({
                  ...prevState,
                  [environment]: {
                    ...prevState[environment],
                    value: newValue || null
                  }
                }))
              }
              value={values[environment].value}
            />
          </React.Fragment>
        ))}
      </Form.Section>
    </Form.SimpleForm>
  )
}

EditSSMParam.propTypes = {
  param: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired,
  pathPrefix: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
}
export { EditSSMParam }
