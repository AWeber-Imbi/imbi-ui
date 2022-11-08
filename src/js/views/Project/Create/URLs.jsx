import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../../state'
import { Form } from '../../../components'
import { httpPost, isURL } from '../../../utils'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

function renderURLTemplate(urlTemplate, attributes, environment) {
  let url = urlTemplate.replace(
    '{environment}',
    environment.toString().toLowerCase()
  )
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== null)
      url = url.replace(`{${key}}`, value.toString().toLowerCase())
  }
  return url
}

async function saveURLs(globalState, projectId, values) {
  const projectURL = new URL(`/projects/${projectId}/urls`, globalState.baseURL)
  if (Object.values(values).length > 0) {
    for (const [environment, url] of Object.entries(values)) {
      let result = await httpPost(globalState.fetch, projectURL, {
        project_id: projectId,
        environment: environment,
        url: url
      })
      if (result.success === false) return [false, result.status, result.data]
    }
    return [true, null]
  }
}

function URLs({ localDispatch, localState }) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState({})
  const [globalState] = useContext(Context)

  useEffect(() => {
    if (
      localState.attributes.environments !== null &&
      localState.attributes.environments.length > 0
    ) {
      if (globalState.projectURLTemplate !== '') {
        const urls = {}
        localState.attributes.environments.forEach((environment) => {
          if (localState.urls[environment] === undefined) {
            urls[environment] = renderURLTemplate(
              globalState.projectURLTemplate,
              localState.attributes,
              environment
            )
          }
        })
        if (urls !== {})
          localDispatch({
            type: 'SET_URLS',
            payload: {
              ...localState.urls,
              ...urls
            }
          })
        localDispatch({
          type: 'SET_URLS_READY',
          payload: true
        })
      }
    }
  }, [localState.attributes.environments])

  // State management to toggle saving of URLs
  useEffect(() => {
    if (
      localState.isSaving &&
      localState.saved.attributes &&
      Object.keys(localState.urls).length > 0 &&
      !localState.saved.urls &&
      !localState.saving.urls
    )
      localDispatch({ type: 'SET_SAVING_URLS', payload: true })
  }, [localState.saved.attributes])

  // Save URLs
  useEffect(() => {
    async function localSaveURLs() {
      const result = await saveURLs(
        globalState,
        localState.projectId,
        localState.urls
      )
      if (result[0]) {
        localDispatch({ type: 'SET_SAVED_URLS', payload: true })
        localDispatch({ type: 'SET_SAVING_URLS', payload: false })
      } else {
        localDispatch({ type: 'SET_SAVING_URLS', payload: false })
        localDispatch({
          type: 'SET_ERROR_MESSAGE',
          payload: result.data
        })
        localDispatch({
          type: 'SET_IS_SAVING',
          payload: false
        })
      }
    }
    if (!localState.saved.urls && localState.saving.urls) {
      localSaveURLs()
    }
  }, [localState.saving.urls])

  function onChange(key, value) {
    const environment = key.substring(4)
    if (value !== '') {
      const newErrors = { ...errors }
      if (isURL(value)) {
        errors[key] = null
        setErrors(newErrors)
        localDispatch({
          type: 'SET_URLS',
          payload: {
            ...localState.urls,
            [environment]: value
          }
        })
        localDispatch({
          type: 'SET_URLS_READY',
          payload: true
        })
      } else {
        newErrors[key] = 'Invalid URL'
        setErrors(newErrors)
        localDispatch({
          type: 'SET_URLS_READY',
          payload: false
        })
      }
    } else {
      const urls = { ...localState.urls }
      if (urls[environment] !== undefined) delete urls[environment]
      localDispatch({
        type: 'SET_URLS',
        payload: urls
      })
      localDispatch({
        type: 'SET_URLS_READY',
        payload: true
      })
    }
  }

  return (
    <Form.Section name="urls" title={t('project.projectURLs')}>
      {localState.attributes.environments.map((environment) => {
        return (
          <Form.Field
            title={`${environment} URL`}
            name={`url-${environment}`}
            key={`url-${environment}`}
            type="text"
            errorMessage={errors[`url-${environment}`]}
            onChange={onChange}
            value={
              localState.urls[environment] !== undefined
                ? localState.urls[environment]
                : ''
            }
          />
        )
      })}
    </Form.Section>
  )
}
URLs.propTypes = {
  localDispatch: PropTypes.func,
  localState: PropTypes.object
}
export { URLs }
