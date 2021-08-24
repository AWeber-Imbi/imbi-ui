import PropTypes from 'prop-types'
import { useContext, useEffect, useState } from 'react'

import { Context } from './state'
import { httpGet } from './utils'

function useIntegrations() {
  const [globalState, dispatch] = useContext(Context)
  const [state, setState] = useState({
    gitlab: {
      enabled: false,
      error: null,
      authorizationEndpoint: null,
      clientId: null,
      redirectURI: null,
      project_link_type_id: null
    },
    grafana: {
      enabled: false,
      project_link_type_id: null
    },
    sentry: {
      enabled: false,
      project_link_type_id: null
    },
    sonarqube: {
      enabled: false,
      project_link_type_id: null
    }
  })

  function get(path, onSuccess, onError) {
    httpGet(
      globalState.fetch,
      new URL(path, globalState.baseURL),
      onSuccess,
      onError
    )
  }
  get.propTypes = {
    path: PropTypes.string.isRequired,
    onSuccess: PropTypes.func.isRequired,
    key: PropTypes.string.isRequired
  }

  useEffect(() => {
    const newState = {
      ...state
    }
    get('/ui/settings', (data) => {
      newState.gitlab = {
        ...state.gitlab,
        project_link_type_id: data.integrations.gitlab.project_link_type_id
      }
      newState.grafana = data.integrations.grafana
      newState.sentry = data.integrations.sentry
      newState.sonarqube = data.integrations.sonarqube
      dispatch({
        type: 'SET_PROJECT_URL_TEMPLATE',
        payload: data.project_url_template
      })
    })
    get(
      '/integrations/gitlab',
      (data) => {
        newState.gitlab = {
          ...newState.gitlab,
          enabled: true,
          error: null,
          authorizationEndpoint: data.authorization_endpoint,
          clientId: data.client_id,
          redirectURI: data.callback_url
        }
      },
      (message) => {
        newState.gitlab.enabled = false
        newState.gitlab.error = message
      }
    )
    setState(newState)
  }, [])
  return state
}
export { useIntegrations }
