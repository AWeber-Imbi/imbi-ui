import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../state'
import { httpGet } from '../../utils'
import { useTranslation } from 'react-i18next'

function ProjectPicker({
  disabled,
  name,
  onChange,
  onError,
  readOnly,
  required,
  value
}) {
  const [globalState] = useContext(Context)
  const [projects, setProjects] = useState([])
  const [namespaceID, setNamespaceID] = useState(value?.namespace_id)
  const [projectTypeID, setProjectTypeID] = useState(value?.project_type_id)

  const { t } = useTranslation()

  useEffect(() => {
    if (!projectTypeID || !namespaceID) {
      setProjects([])
      return
    }

    fetchProjects()
  }, [namespaceID, projectTypeID])

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
        setProjects((prevState) => prevState.concat(data.data))
        if (data.rows > offset + limit) {
          fetchProjects(offset + limit)
        }
      },
      (error) => onError(error)
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
            setNamespaceID(event.target.value)
          }}
          required={required}
          value={namespaceID}>
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
            setProjectTypeID(event.target.value)
          }}
          required={required}
          value={projectTypeID}>
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
            if (onChange !== undefined) onChange(name, event.target.value)
          }}
          required={required}
          value={value && value.project_id}>
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
  required: PropTypes.bool,
  value: PropTypes.object
}
export { ProjectPicker }
