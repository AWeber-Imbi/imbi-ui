import PropTypes from 'prop-types'
import React, { Fragment, useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Form } from '../../../components'
import { User } from '../../../schema'
import { httpPost } from '../../../utils'
import { Context } from '../../../state'

function filterCookieCutters(cookieCutters, projectTypeID, type) {
  if (cookieCutters === null) return []
  return cookieCutters.filter(
    (cookieCutter) =>
      cookieCutter.type === type &&
      cookieCutter.project_type_id === projectTypeID
  )
}

function Automations({ localDispatch, localState, user }) {
  const { t } = useTranslation()
  const [globalState] = useContext(Context)

  const gitlabEnabled =
    globalState.integrations.gitlab.enabled === true &&
    user.integrations.includes('gitlab') === true

  const grafanaCookieCutters = filterCookieCutters(
    globalState.metadata.cookieCutters,
    localState.attributes.project_type_id,
    'dashboard'
  )
  const grafanaEnabled =
    globalState.integrations.grafana.enabled && grafanaCookieCutters.length > 0
  const projectCookieCutters = filterCookieCutters(
    globalState.metadata.cookieCutters,
    localState.attributes.project_type_id,
    'project'
  )

  function manageAutomationLinks(automationEnabled, project_link_type_id) {
    const automationLinks = new Set(localState.automationLinks)
    if (automationEnabled && project_link_type_id !== null)
      automationLinks.add(project_link_type_id)
    else automationLinks.delete(project_link_type_id)
    localDispatch({ type: 'SET_AUTOMATION_LINKS', payload: automationLinks })
    if (
      automationEnabled &&
      localState.links[project_link_type_id] !== undefined
    ) {
      const links = { ...localState.links }
      delete links[project_link_type_id]
      localDispatch({ type: 'SET_LINKS', payload: links })
    }
  }

  // Toggle if a gitlab link type id exists and link will be created in an automation
  useEffect(() => {
    manageAutomationLinks(
      localState.createGitlabRepository,
      globalState.integrations.gitlab.project_link_type_id
    )
  }, [localState.createGitlabRepository])

  // State management to kick off automations
  useEffect(() => {
    if (localState.isSaving && localState.saved.attributes) {
      if (localState.createGitlabRepository)
        localDispatch({ type: 'SET_CREATING_GITLAB_REPOSITORY', payload: true })
    }
  }, [localState.saved.attributes])

  // Sonarqube can be run after github.
  useEffect(() => {
    if (localState.isSaving && localState.created.gitlabRepository) {
      if (localState.createSonarqubeProject)
        localDispatch({ type: 'SET_CREATING_SONARQUBE_PROJECT', payload: true })
    }
  }, [localState.created.gitlabRepository])

  // Create Gitlab Repository
  useEffect(() => {
    async function createGitlabRepo() {
      let result = await httpPost(
        globalState.fetch,
        new URL('/ui/automations/gitlab/create', globalState.baseURL),
        {
          project_id: localState.projectId
        }
      )
      if (result.success) {
        localDispatch({ type: 'SET_CREATED_GITLAB_REPOSITORY', payload: true })
        localDispatch({
          type: 'SET_CREATING_GITLAB_REPOSITORY',
          payload: false
        })
      } else {
        localDispatch({
          type: 'SET_CREATING_GITLAB_REPOSITORY',
          payload: false
        })
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
    if (
      localState.isSaving &&
      localState.creating.gitlabRepository &&
      !localState.created.gitlabRepository
    ) {
      createGitlabRepo()
    }
  }, [localState.creating.gitlabRepository])

  // Toggle if a sonarqube link type id exists and link will be created in an automation
  useEffect(() => {
    manageAutomationLinks(
      localState.createSonarqubeProject,
      globalState.integrations.sonarqube.project_link_type_id
    )
  }, [localState.createSonarqubeProject])

  // Project cookie-cutter / initial commit to be run after gitlab and/or sonarqube
  useEffect(() => {
    if (
      localState.isSaving &&
      localState.projectCookieCutter !== null &&
      ((localState.created.gitlabRepository &&
        !localState.createSonarqubeProject) ||
        (localState.created.gitlabRepository &&
          localState.createSonarqubeProject &&
          localState.created.sonarqubeProject))
    ) {
      localDispatch({
        type: 'SET_CREATING_GITLAB_INITIAL_COMMIT',
        payload: true
      })
    }
  }, [localState.created.gitlabRepository, localState.created.sonarqubeProject])

  // Create Sonarqube Project
  useEffect(() => {
    async function createSonarqubeProject() {
      let result = await httpPost(
        globalState.fetch,
        new URL('/ui/automations/sonarqube/create', globalState.baseURL),
        {
          project_id: localState.projectId
        }
      )
      if (result.success) {
        localDispatch({ type: 'SET_CREATED_SONARQUBE_PROJECT', payload: true })
        localDispatch({
          type: 'SET_CREATING_SONARQUBE_PROJECT',
          payload: false
        })
      } else {
        localDispatch({
          type: 'SET_CREATING_SONARQUBE_PROJECT',
          payload: false
        })
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
    if (
      localState.isSaving &&
      localState.creating.sonarqubeProject &&
      !localState.created.sonarqubeProject
    ) {
      createSonarqubeProject()
    }
  }, [localState.creating.sonarqubeProject])

  if (
    gitlabEnabled ||
    globalState.integrations.sonarqube.enabled ||
    grafanaEnabled
  ) {
    return (
      <Form.Section name="automations" title={t('project.projectAutomations')}>
        <Fragment>
          {gitlabEnabled && (
            <Form.Field
              title={t('project.createGitLabRepository')}
              name="createGitlabRepo"
              type="toggle"
              onChange={(key, value) => {
                localDispatch({
                  type: 'SET_CREATE_GITLAB_REPOSITORY',
                  payload: value
                })
              }}
              value={localState.createGitlabRepository}
            />
          )}
          {gitlabEnabled && globalState.integrations.sonarqube.enabled && (
            <Form.Field
              title={t('project.createSonarqubeProject')}
              name="createSonarqubeProject"
              type="toggle"
              disabled={!localState.createGitlabRepository}
              onChange={(key, value) => {
                localDispatch({
                  type: 'SET_CREATE_SONARQUBE_PROJECT',
                  payload: value
                })
              }}
              value={localState.createSonarqubeProject}
            />
          )}
          {globalState.integrations.sentry.enabled && (
            <Form.Field
              title={t('project.createSentryProject')}
              name="createSentryProject"
              type="toggle"
              onChange={(key, value) => {
                localDispatch({
                  type: 'SET_CREATE_SENTRY_PROJECT',
                  payload: value
                })
              }}
              value={localState.createSentryProject}
            />
          )}
          {gitlabEnabled && (
            <Form.Field
              title={t('project.projectCookieCutter')}
              name="projectCookieCutter"
              type="select"
              disabled={projectCookieCutters.length === 0}
              options={projectCookieCutters.map((cookieCutter) => {
                return {
                  label: cookieCutter.name,
                  value: cookieCutter.url
                }
              })}
              onChange={(key, value) => {
                localDispatch({
                  type: 'SET_PROJECT_COOKIECUTTER',
                  payload: value
                })
              }}
              value={localState.projectCookieCutter}
            />
          )}
          {grafanaEnabled && (
            <Form.Field
              title={t('project.dashboardCookieCutter')}
              name="dashboardCookieCutter"
              type="select"
              disabled={true}
              options={grafanaCookieCutters.map((cookieCutter) => {
                return {
                  label: cookieCutter.name,
                  value: cookieCutter.url
                }
              })}
              onChange={(key, value) => {
                localDispatch({
                  type: 'SET_DASHBOARD_COOKIECUTTER',
                  payload: value
                })
              }}
              value={localState.dashboardCookieCutter}
            />
          )}
        </Fragment>
      </Form.Section>
    )
  }
}
Automations.propTypes = {
  localDispatch: PropTypes.func,
  localState: PropTypes.object,
  user: PropTypes.exact(User)
}
export { Automations }
