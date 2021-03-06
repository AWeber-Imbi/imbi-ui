import PropTypes from 'prop-types'
import { useContext, useEffect, useState } from 'react'

import { httpGet } from './utils'
import { Context } from './state'

const RefreshAfter = 300000

function asOptions(data, value = 'id', label = 'name') {
  return data.map((item) => {
    return { label: item[label], value: item[value] }
  })
}
asOptions.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  id: PropTypes.string,
  label: PropTypes.string
}

function useMetadata(externalRefresh = false) {
  const [state] = useContext(Context)
  const [cookieCutters, setCookieCutters] = useState(null)
  const [environments, setEnvironments] = useState(null)
  const [groups, setGroups] = useState(null)
  const [namespaces, setNamespaces] = useState(null)
  const [projectFactTypes, setProjectFactTypes] = useState(null)
  const [projectLinkTypes, setProjectLinkTypes] = useState(null)
  const [projectTypes, setProjectTypes] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [timerHandle, setTimerHandle] = useState(null)
  const [refresh, setRefresh] = useState(true)
  const [values, setValues] = useState(undefined)

  function get(path) {
    httpGet(
      state.fetch,
      new URL(path, state.baseURL),
      (data) => {
        setCookieCutters(data.cookie_cutters)
        setEnvironments(data.environments)
        setGroups(data.groups)
        setNamespaces(data.namespaces)
        setProjectFactTypes(data.project_fact_types)
        setProjectLinkTypes(data.project_link_types)
        setProjectTypes(data.project_types)
        setLastUpdated(Date.now())
        setRefresh(false)
      },
      (error) => {
        console.log('Metadata fetch error', error)
      }
    )
  }
  get.propTypes = {
    path: PropTypes.string.isRequired,
    onSuccess: PropTypes.func.isRequired,
    key: PropTypes.string.isRequired
  }

  useEffect(() => {
    if (lastUpdated === null || externalRefresh === true || refresh === true) {
      get('/ui/metadata')
    }
  }, [externalRefresh, refresh])

  useEffect(() => {
    if (timerHandle !== null) {
      clearTimeout(timerHandle)
    }
    const handle = setTimeout(() => {
      setRefresh(true)
      setTimerHandle(null)
    }, RefreshAfter)
    setTimerHandle(handle)
    return function cleanup() {
      clearTimeout(handle)
    }
  }, [lastUpdated])

  useEffect(() => {
    if (
      cookieCutters !== null &&
      environments !== null &&
      groups !== null &&
      namespaces !== null &&
      projectFactTypes !== null &&
      projectLinkTypes !== null &&
      projectTypes !== null
    ) {
      setValues({
        cookieCutters: cookieCutters,
        environments: environments,
        groups: groups,
        namespaces: namespaces,
        projectFactTypes: projectFactTypes,
        projectLinkTypes: projectLinkTypes,
        projectTypes: projectTypes
      })
    }
  }, [
    cookieCutters,
    environments,
    groups,
    namespaces,
    projectFactTypes,
    projectTypes,
    projectLinkTypes
  ])
  return values
}
useMetadata.propTypes = {
  refresh: PropTypes.boolean
}
export { asOptions, useMetadata }
