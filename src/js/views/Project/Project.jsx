import PropTypes from 'prop-types'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { Outlet, Route, Routes, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  buildStyles,
  CircularProgressbarWithChildren
} from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

import { Context } from '../../state'
import { httpRequest, requestOptions, setDocumentTitle } from '../../utils'
import {
  Alert,
  Error,
  ErrorBoundary,
  Icon,
  IconBar,
  Markdown,
  Tab,
  Tooltip
} from '../../components'

import { Configuration } from './Configuration'
import { Dependencies } from './Dependencies'
import { Logs } from './Logs'
import { Notes } from './Notes'
import { Overview } from './Overview'
import { Settings } from './Settings'

function ProjectPage({ project, factTypes, refresh }) {
  const [state, dispatch] = useContext(Context)
  const { t } = useTranslation()
  const baseURL = `/ui/projects/${project.id}`
  let color = '#cccccc'
  if (project.project_score >= 0) color = 'red'
  if (project.project_score > 69) color = 'gold'
  if (project.project_score > 89) color = '#00c800'

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        url: new URL(baseURL, state.baseURL.toString()),
        title: project.name
      }
    })
  }, [])

  return (
    <ErrorBoundary>
      <div className="flex-auto px-6 py-4 space-y-3">
        <div className="flex items-center">
          <div className="flex-1 flex flex-col space-y-2 ml-2">
            <h1 className="text-gray-600 text-xl">
              <Icon icon={project.project_icon} className="mr-2" />
              {project.name}
              <span className="text-base ml-2">({project.project_type})</span>
            </h1>
            <div className="text-gray-500">
              {project.links.length === 0 && ' '}
              {project.links.length > 0 && (
                <Fragment>
                  <span className="mr-2">{t('terms.links')}:</span>
                  <IconBar icons={project.links} />
                </Fragment>
              )}
            </div>
          </div>
          {project.archived === true && (
            <div className="flex-1 flex justify-center">
              <Alert level="warning" className="flex-shrink">
                {t('project.archived')}
              </Alert>
            </div>
          )}
          <div className="flex-1 flex justify-end">
            <div
              className="flex-shrink mr-2"
              style={{ height: '60px', width: '60px' }}>
              <Tooltip
                value={t('project.projectHealthScore')}
                arrowPosition="right">
                <CircularProgressbarWithChildren
                  value={project.project_score}
                  styles={buildStyles({
                    pathColor: color,
                    trailColor: '#ccc'
                  })}>
                  <div className="absolute text-gray-600 font-semibold text-lg">
                    {parseInt(project.project_score)}
                  </div>
                </CircularProgressbarWithChildren>
              </Tooltip>
            </div>
          </div>
        </div>
        <Markdown className="mx-2 text-sm text-gray-500">
          {project.description}
        </Markdown>
        <nav
          className="relative z-0 rounded-lg shadow flex divide-x divide-gray-200"
          aria-label="Tabs">
          <Tab to={baseURL} isFirst={true}>
            {t('common.overview')}
          </Tab>
          <Tab to={`${baseURL}/configuration`}>{t('common.configuration')}</Tab>
          <Tab to={`${baseURL}/dependencies`}>{t('project.dependencies')}</Tab>
          <Tab to={`${baseURL}/logs`}>{t('common.logs')}</Tab>
          <Tab to={`${baseURL}/notes`}>{t('common.notes')}</Tab>
          <Tab
            to={`/ui/operations-log?f=${encodeURIComponent(
              `project_id:${project.id}`
            )}`}
            isLast={project.archived}>
            {t('operationsLog.title')}
          </Tab>
          {project.archived !== true && (
            <Tab to={`${baseURL}/settings`} isLast={true} shrink={true}>
              <Icon icon="fas cog" />
            </Tab>
          )}
        </nav>
        <Routes>
          <Route
            path={''}
            element={
              <Overview
                factTypes={factTypes}
                project={project}
                refresh={refresh}
                urlPath={baseURL}
              />
            }
          />
          <Route
            path={`configuration`}
            element={<Configuration urlPath={baseURL} />}
          />
          <Route
            path={`dependencies`}
            element={<Dependencies urlPath={baseURL} />}
          />
          <Route path={`logs`} element={<Logs urlPath={baseURL} />} />
          <Route
            path={`notes`}
            element={<Notes project={project} urlPath={baseURL} />}
          />
          <Route
            path={`settings`}
            element={
              <Settings project={project} refresh={refresh} urlPath={baseURL} />
            }
          />
        </Routes>
        <Outlet />
      </div>
    </ErrorBoundary>
  )
}
ProjectPage.propTypes = {
  factTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  project: PropTypes.object.isRequired,
  refresh: PropTypes.func
}

function Project() {
  const [globalState] = useContext(Context)
  const { projectId } = useParams()
  const [state, setState] = useState({
    errorMessage: null,
    loading: false,
    notFound: false,
    project: null,
    factTypes: null
  })
  const { t } = useTranslation()

  function loadProject() {
    setState({ ...state, loading: true })
    const factTypeURL = new URL(
      `/projects/${projectId}/fact-types`,
      globalState.baseURL
    )
    const projectURL = new URL(`/projects/${projectId}`, globalState.baseURL)
    projectURL.searchParams.append('full', 'true')
    Promise.all([
      httpRequest(globalState.fetch, factTypeURL, requestOptions),
      httpRequest(globalState.fetch, projectURL, requestOptions)
    ]).then(([factTypes, project]) => {
      const newState = { ...state, errorMessage: null }
      if (factTypes.success) newState.factTypes = factTypes.data
      else newState.errorMessage = factTypes.data
      if (project.success) newState.project = project.data
      else {
        if (project.status === 404) newState.notFound = true
        newState.errorMessage = project.data
      }
      setState({ ...newState, loading: false })
      window.scrollTo(0, 0)
    })
  }

  useEffect(() => {
    if (state.project === null) loadProject()
  }, [projectId, state.project])

  if (state.notFound) {
    setDocumentTitle(t('common.notFound'))
    return <Error>{t('error.notFound')}</Error>
  } else if (state.project === null || state.loading) {
    return <></>
  } else
    return (
      <ProjectPage
        errorMessage={state.errorMessage}
        factTypes={state.factTypes}
        project={state.project}
        refresh={loadProject}
      />
    )
}
Project.propTypes = {}
export { Project }
