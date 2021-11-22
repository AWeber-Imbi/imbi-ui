import PropTypes from 'prop-types'
import React, {
  Fragment,
  useContext,
  useEffect,
  useReducer,
  useState
} from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Context } from '../../../state'
import { ErrorBoundary, Form } from '../../../components'
import { User } from '../../../schema'

import { Attributes } from './Attributes'
import { Automations } from './Automations'
import { initialState, reducer } from './Reducer'
import { GitlabConnectModal } from './GitlabConnectModal'
import { SavingDialog } from './SavingDialog'
import { Links } from './Links'
import { URLs } from './URLs'

function Create({ user }) {
  const { t } = useTranslation()

  const attributesLink = { href: '#attributes', label: t('project.attributes') }
  const automationsLink = {
    href: '#automations',
    label: t('project.automations')
  }
  const history = useHistory()
  const linksLink = { href: '#links', label: t('project.links') }
  const urlsLink = { href: '#urls', label: t('project.urls') }
  const [globalState, globalDispatch] = useContext(Context)
  const [localState, localDispatch] = useReducer(reducer, initialState)
  const [showGitlabModal, setShowGitlabModal] = useState(
    globalState.integrations.gitlab.enabled &&
      !user.integrations.includes('gitlab')
  )
  const automationsEnabled =
    (globalState.integrations.gitlab.enabled &&
      user.integrations.includes('gitlab')) ||
    globalState.integrations.grafana.enabled ||
    globalState.integrations.sentry.enabled ||
    globalState.integrations.sonarqube.enabled
  const [sidebarLinks, setSidebarLinks] = useState(buildSidebarLinks())

  function buildSidebarLinks() {
    const links = [attributesLink]
    if (
      localState.attributes.environments !== null &&
      localState.attributes.environments.length > 0
    )
      links.push(urlsLink)
    if (automationsEnabled) links.push(automationsLink)
    links.push(linksLink)
    return links
  }

  useEffect(() => {
    globalDispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'projects.newProject',
        url: new URL('/ui/projects/create', globalState.baseURL)
      }
    })
  }, [])

  useEffect(() => {
    if (
      localState.attributes.environments !== null &&
      localState.attributes.environments.length > 0
    ) {
      setSidebarLinks(buildSidebarLinks())
    }
  }, [localState.attributes.environments])

  return (
    <ErrorBoundary>
      <Form.MultiSectionForm
        disabled={localState.attributesReady === false}
        icon="fas file"
        instructions={
          <div className="ml-2 text-sm">* {t('common.required')}</div>
        }
        errorMessage={
          localState.errorMessage !== null
            ? t('project.createError', { message: localState.errorMessage })
            : null
        }
        sideBarLinks={sidebarLinks}
        sideBarTitle={t('projects.newProject')}
        onSubmit={(event) => {
          event.preventDefault()
          localDispatch({ type: 'SET_IS_SAVING', payload: true })
        }}
        submitButtonText={
          localState.isSaving ? t('common.saving') : t('common.save')
        }
      >
        <Fragment>
          <Attributes localDispatch={localDispatch} localState={localState} />
          {automationsEnabled && (
            <Automations
              localDispatch={localDispatch}
              localState={localState}
              user={user}
            />
          )}
          {localState.attributes.environments !== null &&
            localState.attributes.environments.length > 0 && (
              <URLs localDispatch={localDispatch} localState={localState} />
            )}
          {globalState.metadata.projectLinkTypes.length > 0 && (
            <Links localDispatch={localDispatch} localState={localState} />
          )}
        </Fragment>
      </Form.MultiSectionForm>
      {showGitlabModal && (
        <GitlabConnectModal
          onClose={() => {
            setShowGitlabModal(false)
          }}
          user={user}
        />
      )}
      {localState.isSaving && (
        <SavingDialog
          complete={{
            attributes: localState.saved.attributes,
            gitlab: localState.created.gitlabRepository,
            grafanaCookieCutter: localState.created.grafanaDashboard,
            links: localState.saved.links,
            projectCookieCutter: localState.created.gitlabInitialCommit,
            sentry: localState.created.sentryProject,
            sonarqube: localState.created.sonarqubeProject,
            urls: localState.saved.urls
          }}
          options={{
            gitlab: localState.createGitlabRepository,
            grafanaCookieCutter: localState.dashboardCookieCutter !== null,
            links:
              globalState.metadata.projectLinkTypes.length > 0 &&
              Object.keys(localState.links).length > 0,
            projectCookieCutter: localState.projectCookieCutter !== null,
            sentry: localState.createSentryProject,
            sonarqube: localState.createSonarqubeProject,
            urls: Object.keys(localState.urls).length > 0
          }}
          onSaveComplete={(event) => {
            event.preventDefault()
            history.push(`/ui/projects/${localState.projectId}`)
          }}
          translate={t}
        />
      )}
    </ErrorBoundary>
  )
}
Create.propTypes = {
  user: PropTypes.exact(User)
}
export { Create }
