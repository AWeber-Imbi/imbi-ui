import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { httpGet, httpRequest, requestOptions } from '../../utils'
import { useTranslation } from 'react-i18next'

function ProjectPicker({
  disabled,
  name,
  onChange,
  onError,
  readOnly,
  required
}) {
  const [globalState, dispatch] = useContext(Context)
  const [namespaces, setNamespaces] = useState([])
  const [projectTypes, setProjectTypes] = useState([])
  const [projects, setProjects] = useState([])
  const [namespaceID, setNamespaceID] = useState()
  const [projectTypeID, setProjectTypeID] = useState()

  const { t } = useTranslation()

  useEffect(() => {
    const namespacesURL = new URL('/namespaces', globalState.baseURL)
    const projectTypesURL = new URL('/project-types', globalState.baseURL)

    Promise.all([
      httpRequest(globalState.fetch, namespacesURL, requestOptions),
      httpRequest(globalState.fetch, projectTypesURL, requestOptions)
    ]).then(([namespacesResponse, projectTypesResponse]) => {
      if (!namespacesResponse.success) {
        onError(namespacesResponse.data)
      } else if (!projectTypesResponse.success) {
        onError(projectTypesResponse.data)
      } else {
        setNamespaces(namespacesResponse.data)
        setProjectTypes(projectTypesResponse.data)
      }
    })
  }, [])

  useEffect(() => {
    if (!projectTypeID || !namespaceID) return

    const projectsURL = new URL(
      `/projects?namespace_id=${encodeURIComponent(
        namespaceID
      )}&project_type_id=${encodeURIComponent(projectTypeID)}`,
      globalState.baseURL
    )
    httpGet(
      globalState.fetch,
      projectsURL,
      (result) => {
        setProjects(result.data)
      },
      (error) => {
        onError(error)
      }
    )
  }, [namespaceID, projectTypeID])

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
            setNamespaceID(event.target.value)
          }}
          required={required}>
          <option value="" />
          {namespaces.map((n) => (
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
            setProjectTypeID(event.target.value)
          }}
          required={required}>
          <option value="" />
          {projectTypes.map((t) => (
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
            if (onChange !== undefined) onChange(name, event.target.value)
          }}
          required={required}>
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
ProjectPicker.defaultProps = {
  disabled: false,
  readOnly: false,
  required: false
}
ProjectPicker.propTypes = {
  disabled: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onError: PropTypes.func,
  readOnly: PropTypes.bool,
  required: PropTypes.bool
}
export { ProjectPicker }
