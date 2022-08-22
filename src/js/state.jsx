import PropTypes from 'prop-types'
import React, { createContext, useReducer } from 'react'

import { processBreadcrumbs } from './components/Breadcrumbs'

const Reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        breadcrumbs: processBreadcrumbs(
          state.breadcrumbs.crumbs,
          action.payload
        )
      }
    case 'HIDE_BREADCRUMBS':
      return {
        ...state,
        breadcrumbs: {
          crumbs: state.breadcrumbs.crumbs,
          display: false
        }
      }
    case 'SHOW_BREADCRUMBS':
      return {
        ...state,
        breadcrumbs: {
          crumbs: state.breadcrumbs.crumbs,
          display: true
        }
      }
    case 'SET_BREADCRUMBS':
      return {
        ...state,
        breadcrumbs: action.payload
      }
    case 'SET_ERROR':
      return {
        ...state,
        errorMessage: action.payload
      }
    case 'SET_INTEGRATIONS':
      return {
        ...state,
        integrations: action.payload
      }
    case 'SET_METADATA':
      return {
        ...state,
        metadata: action.payload
      }
    case 'SET_OPENSEARCH':
      return {
        ...state,
        openSearch: action.payload
      }
    case 'SET_PROJECT_URL_TEMPLATE':
      return {
        ...state,
        projectURLTemplate: action.payload
      }
    case 'SET_PROJECTS_FIELDS':
      return {
        ...state,
        projects: {
          ...state.projects,
          fields: action.payload
        }
      }
    case 'SET_PROJECTS_FILTER':
      return {
        ...state,
        projects: {
          ...state.projects,
          filter: action.payload
        }
      }
    case 'SET_PROJECTS_INCLUDE_ARCHIVED':
      return {
        ...state,
        projects: {
          ...state.projects,
          includeArchived: action.payload
        }
      }
    case 'SET_PROJECTS_SORT':
      return {
        ...state,
        projects: {
          ...state.projects,
          sort: action.payload
        }
      }
    case 'SET_REFRESH_SETTINGS':
      return {
        ...state,
        refreshSettings: action.payload
      }
    default:
      return state
  }
}

const initialState = {
  baseURL: null,
  fetch: undefined,
  breadcrumbs: {
    crumbs: [],
    display: false
  },
  errorMessage: null,
  handleLogout: () => {},
  integrations: undefined,
  metadata: undefined,
  openSearch: undefined,
  projects: {
    filter: '',
    fields: ['id', 'namespace', 'project_type', 'name', 'project_score'],
    sort: {
      namespace: 'asc',
      name: 'asc'
    }
  },
  projectURLTemplate: '',
  refreshSettings: true
}

const State = ({
  baseURL,
  fetchMethod,
  handleLogout,
  integrations,
  metadata,
  openSearch,
  setErrorMessage,
  children
}) => {
  const [state, dispatch] = useReducer(Reducer, {
    ...initialState,
    baseURL: baseURL,
    fetch: fetchMethod,
    integrations: integrations,
    metadata: metadata,
    openSearch: openSearch,
    handleLogout: handleLogout,
    setErrorMessage: setErrorMessage
  })
  return (
    <Context.Provider value={[state, dispatch]}>{children}</Context.Provider>
  )
}
State.propTypes = {
  baseURL: PropTypes.instanceOf(URL).isRequired,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element)
  ]),
  fetchMethod: PropTypes.func.isRequired,
  handleLogout: PropTypes.func.isRequired,
  integrations: PropTypes.object,
  metadata: PropTypes.object,
  openSearch: PropTypes.arrayOf(PropTypes.object),
  projects: PropTypes.object,
  projectURLTemplate: PropTypes.string,
  refreshSettings: PropTypes.bool,
  setErrorMessage: PropTypes.func.isRequired
}
const Context = createContext(initialState)
Context.displayName = 'StateContext'
export { Context }
export default State
