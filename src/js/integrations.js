import PropTypes from 'prop-types'
import { useContext, useEffect, useState } from 'react'

import { httpGet } from './utils'
import { Context } from './state'

function useIntegrations() {
  const [globalState] = useContext(Context)
  const [state, setState] = useState({
    gitlab: {
      enabled: false,
      error: null,
      authorizationEndpoint: null,
      clientId: null,
      redirectURI: null
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
        console.log('on success')
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

useIntegrations.propTypes = {
  refresh: PropTypes.boolean
}
export { useIntegrations }
