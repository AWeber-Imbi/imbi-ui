import PropTypes from 'prop-types'
import { useContext, useEffect, useState } from 'react'

import { httpGet } from './utils'
import { Context } from './state'

const RefreshAfter = 300000

function metadataAsOptions(data, value = 'id', label = 'name') {
  return data.map((item) => {
    return { label: item[label], value: item[value] }
  })
}
metadataAsOptions.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  id: PropTypes.string,
  label: PropTypes.string
}

function useSettings() {
  const [globalState, dispatch] = useContext(Context)
  const [integrations, setIntegrations] = useState({
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
  const [lastUpdated, setLastUpdated] = useState(null)
  const [metadata, setMetadata] = useState({
    cookie_cutters: [],
    environments: [],
    groups: [],
    namespaces: [],
    project_fact_types: [],
    project_link_types: [],
    project_types: []
  })
  const [openSearch, setOpenSearch] = useState(null)
  const [projectURLTemplate, setProjectURLTemplate] = useState(null)
  const [timerHandle, setTimerHandle] = useState(null)

  useEffect(() => {
    console.log('globalState.refreshSettings', globalState.refreshSettings)
    if (globalState.refreshSettings === true) {
      dispatch({
        type: 'SET_REFRESH_SETTINGS',
        payload: false
      })
      console.log('Getting settings')
      httpGet(
        globalState.fetch,
        new URL('/ui/settings', globalState.baseURL),
        (data) => {
          console.log('Retrieved settings')
          setIntegrations(data.integrations)
          setMetadata(data.metadata)
          setOpenSearch(data.opensearch)
          setProjectURLTemplate(data.project_url_template)
          setLastUpdated(Date.now())
        },
        (error) => {
          dispatch({
            type: 'SET_ERROR',
            error: `Failed to fetch settings ${error}`
          })
        }
      )
    }
  }, [globalState.refreshSettings])

  useEffect(() => {
    if (lastUpdated !== null) {
      if (timerHandle !== null) {
        clearTimeout(timerHandle)
      }
      const handle = setTimeout(() => {
        dispatch({
          type: 'SET_REFRESH_SETTINGS',
          payload: true
        })
        setTimerHandle(null)
      }, RefreshAfter)
      setTimerHandle(handle)
      return function cleanup() {
        clearTimeout(handle)
      }
    }
  }, [lastUpdated])

  useEffect(() => {
    // Grab user specific integrations settings
    if (integrations.gitlab.enabled === true) {
      httpGet(
        globalState.fetch,
        new URL('/integrations/gitlab', globalState.baseURL),
        (data) => {
          setIntegrations({
            ...integrations,
            gitlab: {
              ...integrations.gitlab,
              error: null,
              authorizationEndpoint: data.authorization_endpoint,
              clientId: data.client_id,
              redirectURI: data.callback_url
            }
          })
        },
        (error) => {
          setIntegrations({
            ...integrations,
            gitlab: {
              enabled: false,
              error: error
            }
          })
        }
      )
    }
  }, [integrations.gitlab.enabled])

  useEffect(() => {
    if (lastUpdated !== null) {
      dispatch({
        type: 'SET_INTEGRATIONS',
        payload: integrations
      })
    }
  }, [lastUpdated])

  useEffect(() => {
    if (lastUpdated !== null) {
      dispatch({
        type: 'SET_METADATA',
        payload: metadata
      })
    }
  }, [lastUpdated])

  useEffect(() => {
    if (lastUpdated !== null) {
      dispatch({
        type: 'SET_OPENSEARCH',
        payload: openSearch
      })
    }
  }, [lastUpdated])

  useEffect(() => {
    if (lastUpdated !== null) {
      dispatch({
        type: 'SET_PROJECT_URL_TEMPLATE',
        payload: projectURLTemplate
      })
    }
  }, [lastUpdated])

  return lastUpdated
}

useSettings.propTypes = {}
export { metadataAsOptions, useSettings }
