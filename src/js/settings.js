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
    github: {
      enabled: false,
      error: null,
      authorizationEndpoint: null,
      clientId: null,
      redirectURI: null,
      apiEndpoint: null,
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
    cookieCutters: [],
    environments: [],
    groups: [],
    namespaces: [],
    projectConfigurationTypes: [],
    projectFactTypes: [],
    projectLinkTypes: [],
    projectTypes: []
  })
  const [openSearch, setOpenSearch] = useState(null)
  const [projectURLTemplate, setProjectURLTemplate] = useState(null)
  const [opsLogURLTemplate, setOpsLogURLTemplate] = useState()
  const [ssmPrefixTemplate, setSSMPrefixTemplate] = useState()
  const [timerHandle, setTimerHandle] = useState(null)

  useEffect(() => {
    if (globalState.refreshSettings === true) {
      dispatch({
        type: 'SET_REFRESH_SETTINGS',
        payload: false
      })
      httpGet(
        globalState.fetch,
        new URL('/ui/settings', globalState.baseURL),
        ({ data }) => {
          setIntegrations(data.integrations)
          setMetadata({
            cookieCutters: data.metadata.cookie_cutters,
            environments: data.metadata.environments,
            groups: data.metadata.groups,
            namespaces: data.metadata.namespaces,
            projectConfigurationTypes:
              data.metadata.project_configuration_types,
            projectFactTypes: data.metadata.project_fact_types,
            projectLinkTypes: data.metadata.project_link_types,
            projectTypes: data.metadata.project_types,
            changeTypes: [
              'Configured',
              'Decommissioned',
              'Deployed',
              'Migrated',
              'Provisioned',
              'Restarted',
              'Rolled Back',
              'Scaled',
              'Upgraded'
            ]
          })
          setOpenSearch(data.opensearch)
          setProjectURLTemplate(data.project_url_template)
          setOpsLogURLTemplate(data.ops_log_ticket_slug_template)
          setSSMPrefixTemplate(data.ssm_prefix_template)
          setLastUpdated(Date.now())
        },
        ({ message }) => {
          dispatch({
            type: 'SET_ERROR',
            error: `Failed to fetch settings ${message}`
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
        ({ data }) => {
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
        ({ message }) => {
          setIntegrations({
            ...integrations,
            gitlab: {
              enabled: false,
              error: message
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
      dispatch({
        type: 'SET_METADATA',
        payload: metadata
      })
      dispatch({
        type: 'SET_OPENSEARCH',
        payload: openSearch
      })
      dispatch({
        type: 'SET_PROJECT_URL_TEMPLATE',
        payload: projectURLTemplate
      })
      dispatch({
        type: 'SET_OPS_LOG_URL_TEMPLATE',
        payload: opsLogURLTemplate
      })
      dispatch({
        type: 'SET_SSM_PREFIX_TEMPLATE',
        payload: ssmPrefixTemplate
      })
    }
  }, [lastUpdated])

  return lastUpdated
}

useSettings.propTypes = {}
export { metadataAsOptions, useSettings }
