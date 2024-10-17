import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { httpGet } from '../../utils'
import { useTranslation } from 'react-i18next'

function ProjectPicker({
  disabled = false,
  name,
  onChange,
  onError,
  readOnly = false,
  required = false,
  value
}) {
  const [globalState] = useContext(Context)
  const [projects, setProjects] = useState([])
  const [namespaceID, setNamespaceID] = useState(value?.namespace_id)
  const [projectTypeID, setProjectTypeID] = useState(value?.project_type_id)
  const [projectID, setProjectID] = useState(value?.project_id)

  const { t } = useTranslation()

  useEffect(() => {
    if (projectID && (!projectTypeID || !namespaceID)) {
      httpGet(
        globalState.fetch,
        new URL(`/projects/${projectID}`, globalState.baseURL),
        ({ data }) => {
          setNamespaceID(data.namespace_id)
          setProjectTypeID(data.project_type_id)
        },
        (error) => {
          console.debug(`failed to retrieve project ${value.project_id}`, error)
          setProjectID(null)
          if (onChange !== undefined) {
            onChange(name, null)
          }
        }
      )
    }
    if (!projectTypeID || !namespaceID) {
      setProjects([])
      return
    }
    fetchProjects()
  }, [namespaceID, projectTypeID])

  useEffect(() => {
    if (onChange !== undefined) {
      onChange(name, {
        project_id: projectID,
        namespace_id: namespaceID,
        project_type_id: projectTypeID
      })
    }
  }, [namespaceID, projectTypeID, projectID])

  function fetchProjects(offset = 0) {
    const limit = 100
    const projectURL = new URL('/projects', globalState.baseURL)
    const params = new URLSearchParams({
      namespace_id: namespaceID,
      project_type_id: projectTypeID,
      limit,
      offset
    })
    projectURL.search = params.toString()
    httpGet(
      globalState.fetch,
      projectURL,
      ({ data }) => {
        setProjects((prevState) =>
          offset === 0 ? data.data : prevState.concat(data.data)
        )
        if (data.rows > offset + limit) {
          fetchProjects(offset + limit)
        }
      },
      ({ message }) => onError(message)
    )
  }

  return (
    <div className={'flex gap-2'}>
      <div className={'flex-1'}>
        <select
          className={'form-input pl-3 pr-8 text-ellipsis'}
          disabled={disabled || readOnly}
          id={'field-' + name}
          onBlur={(event) => {
            event.preventDefault()
          }}
          onChange={(event) => {
            event.preventDefault()
            setNamespaceID(
              event.target.value === '' ? null : parseInt(event.target.value)
            )
          }}
          required={required}
          value={namespaceID ? namespaceID : ''}>
          <option value="" />
          {globalState.metadata.namespaces.map((n) => (
            <option value={n.id} key={n.id}>
              {n.name}
            </option>
          ))}
        </select>
        <p className="ml-2 mt-2 text-sm text-gray-500">
          {t('terms.namespace')}
        </p>
      </div>

      <div className={'flex-1'}>
        <select
          className={'form-input pl-3 pr-8 text-ellipsis'}
          disabled={disabled || readOnly}
          id={'field-' + name}
          onBlur={(event) => {
            event.preventDefault()
          }}
          onChange={(event) => {
            event.preventDefault()
            setProjectTypeID(
              event.target.value === '' ? null : parseInt(event.target.value)
            )
          }}
          required={required}
          value={projectTypeID ? projectTypeID : ''}>
          <option value="" />
          {globalState.metadata.projectTypes.map((t) => (
            <option value={t.id} key={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <p className="ml-2 mt-2 text-sm text-gray-500">
          {t('terms.projectType')}
        </p>
      </div>

      <div className={'flex-1'}>
        <select
          className={'form-input pl-3 pr-8 text-ellipsis'}
          disabled={disabled || readOnly || !namespaceID || !projectTypeID}
          id={'field-' + name}
          onBlur={(event) => {
            event.preventDefault()
          }}
          onChange={(event) => {
            event.preventDefault()
            setProjectID(
              event.target.value === '' ? null : parseInt(event.target.value)
            )
          }}
          required={required}
          value={projectID ? projectID : ''}>
          <option value="" />
          {projects.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="ml-2 mt-2 text-sm text-gray-500">{t('terms.project')}</p>
      </div>
    </div>
  )
}

ProjectPicker.propTypes = {
  disabled: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onError: PropTypes.func,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  value: PropTypes.shape({
    namespace_id: PropTypes.number,
    project_id: PropTypes.number,
    project_type_id: PropTypes.number
  })
}
export { ProjectPicker }
