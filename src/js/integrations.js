import PropTypes from 'prop-types'
import { useContext, useEffect, useState } from 'react'

import { Context } from './state'
import { httpGet } from './utils'

function useIntegrations() {
  const [globalState] = useContext(Context)
  const [state, setState] = useState({
    gitlab: {
      enabled: false,
      error: null,
      authorizationEndpoint: null,
      clientId: null,
      redirectURI: null
    },
    grafana: {
      enabled: false
    },
    sentry: {
      enabled: false
    },
    sonarqube: {
      enabled: false
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
    get(
      '/integrations/gitlab',
      (data) => {
        setState({
          ...state,
          gitlab: {
            enabled: true,
            error: null,
            authorizationEndpoint: data.authorization_endpoint,
            clientId: data.client_id,
            redirectURI: data.callback_url
          }
        })
      },
      (message) => {
        setState({
          ...state,
          gitlab: {
            enabled: false,
            error: message,
            authorizationEndpoint: null,
            clientId: null,
            redirectURI: null
          }
        })
      }
    )
  }, [])
  return state
}
export { useIntegrations }
