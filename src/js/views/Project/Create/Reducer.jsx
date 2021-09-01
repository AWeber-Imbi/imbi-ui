const emptyAttributes = {
  namespace_id: null,
  project_type_id: null,
  name: null,
  slug: null,
  description: null,
  environments: null
}

const initialState = {
  attributes: { ...emptyAttributes },
  attributesReady: false,
  automationLinks: new Set(),
  createGitlabRepository: false,
  createSentryProject: false,
  createSonarqubeProject: false,
  dashboardCookieCutter: null,
  errorMessage: null,
  isSaving: false,
  links: {},
  linksReady: true,
  projectCookieCutter: null,
  creating: {
    gitlabInitialCommit: false,
    gitlabRepository: false,
    grafanaDashboard: false,
    sentryProject: false,
    sonarqubeProject: false
  },
  created: {
    gitlabInitialCommit: false,
    gitlabRepository: false,
    grafanaDashboard: false,
    sentryProject: false,
    sonarqubeProject: false
  },
  projectId: null,
  saving: {
    attributes: false,
    links: false,
    urls: false
  },
  saved: {
    attributes: false,
    links: false,
    urls: false
  },
  urls: {},
  urlsReady: false
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ATTRIBUTES':
      return {
        ...state,
        attributes: action.payload
      }
    case 'SET_ATTRIBUTES_READY':
      return {
        ...state,
        attributesReady: action.payload
      }
    case 'SET_AUTOMATION_LINKS':
      return {
        ...state,
        automationLinks: action.payload
      }
    case 'SET_CREATE_GITLAB_REPOSITORY':
      return {
        ...state,
        createGitlabRepository: action.payload
      }
    case 'SET_CREATED_GITLAB_REPOSITORY':
      return {
        ...state,
        created: {
          ...state.created,
          gitlabRepository: action.payload
        }
      }
    case 'SET_CREATING_GITLAB_REPOSITORY':
      return {
        ...state,
        creating: {
          ...state.creating,
          gitlabRepository: action.payload
        }
      }
    case 'SET_CREATED_GITLAB_INITIAL_COMMIT':
      return {
        ...state,
        created: {
          ...state.created,
          gitlabInitialCommit: action.payload
        }
      }
    case 'SET_CREATING_GITLAB_INITIAL_COMMIT':
      return {
        ...state,
        creating: {
          ...state.creating,
          gitlabInitialCommit: action.payload
        }
      }
    case 'SET_CREATING_GRAFANA_DASHBOARD':
      return {
        ...state,
        creating: {
          ...state.creating,
          grafanaDashboard: action.payload
        }
      }
    case 'SET_CREATED_GRAFANA_DASHBOARD':
      return {
        ...state,
        created: {
          ...state.created,
          grafanaDashboard: action.payload
        }
      }
    case 'SET_CREATE_SENTRY_PROJECT':
      return {
        ...state,
        createSentryProject: action.payload
      }
    case 'SET_CREATE_SONARQUBE_PROJECT':
      return {
        ...state,
        createSonarqubeProject: action.payload
      }
    case 'SET_CREATED_SONARQUBE_PROJECT':
      return {
        ...state,
        created: {
          ...state.created,
          sonarqubeProject: action.payload
        }
      }
    case 'SET_CREATING_SONARQUBE_PROJECT':
      return {
        ...state,
        creating: {
          ...state.creating,
          sonarqubeProject: action.payload
        }
      }
    case 'SET_DASHBOARD_COOKIECUTTER':
      return {
        ...state,
        dashboardCookieCutter: action.payload
      }
    case 'SET_ERROR_MESSAGE':
      return {
        ...state,
        errorMessage: action.payload
      }
    case 'SET_LINKS':
      return {
        ...state,
        links: action.payload
      }
    case 'SET_LINKS_READY':
      return {
        ...state,
        linksReady: action.payload
      }
    case 'SET_PROJECT_COOKIECUTTER':
      return {
        ...state,
        projectCookieCutter: action.payload
      }
    case 'SET_PROJECT_ID':
      return {
        ...state,
        projectId: action.payload
      }
    case 'SET_SAVED_ATTRIBUTES':
      return {
        ...state,
        saved: {
          ...state.saved,
          attributes: action.payload
        }
      }
    case 'SET_IS_SAVING':
      return {
        ...state,
        isSaving: action.payload
      }
    case 'SET_SAVING_ATTRIBUTES':
      return {
        ...state,
        saving: {
          ...state.saving,
          attributes: action.payload
        }
      }
    case 'SET_SAVED_LINKS':
      return {
        ...state,
        saved: {
          ...state.saved,
          links: action.payload
        }
      }
    case 'SET_SAVING_LINKS':
      return {
        ...state,
        saving: {
          ...state.saving,
          links: action.payload
        }
      }
    case 'SET_SAVED_URLS':
      return {
        ...state,
        saved: {
          ...state.saved,
          urls: action.payload
        }
      }
    case 'SET_SAVING_URLS':
      return {
        ...state,
        saving: {
          ...state.saving,
          urls: action.payload
        }
      }
    case 'SET_URLS':
      return {
        ...state,
        urls: action.payload
      }
    case 'SET_URLS_READY':
      return {
        ...state,
        urlsReady: action.payload
      }
    default:
      return state
  }
}
export { emptyAttributes, initialState, reducer }
