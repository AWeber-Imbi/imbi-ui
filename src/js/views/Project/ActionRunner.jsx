import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Button } from '../../components/Button/Button'
import { Select } from '../../components/Form/Select'
import { Context } from '../../state'
import { httpRequest, requestOptions } from '../../utils'

function ActionRunner({ project }) {
  const [globalState] = useContext(Context)
  const [state, setState] = useState({
    actions: [],
    selectedAction: '',
    tags: [],
    selectedTag: '',
    selectedEnvironment: '',
    loading: false,
    error: null,
    success: false,
    resetKey: 0
  })

  useEffect(() => {
    loadActions()
  }, [])

  async function loadActions() {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    const url = new URL(
      `/ui/projects/${project.id}/actions`,
      globalState.baseURL
    )
    const result = await httpRequest(globalState.fetch, url, requestOptions)
    if (result.success) {
      setState((prev) => ({
        ...prev,
        actions: result.data,
        loading: false
      }))
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: result.data
      }))
    }
  }

  async function loadGitHubTags() {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    const url = new URL(
      `/github/projects/${project.id}/tags`,
      globalState.baseURL
    )
    const result = await httpRequest(globalState.fetch, url, requestOptions)
    if (result.success) {
      setState((prev) => ({
        ...prev,
        tags: result.data,
        loading: false
      }))
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: result.data
      }))
    }
  }

  async function createGitHubDeployment() {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    const url = new URL(
      `/github/projects/${project.id}/deployments`,
      globalState.baseURL
    )
    const result = await httpRequest(globalState.fetch, url, {
      ...requestOptions,
      method: 'POST',
      body: JSON.stringify({
        ref: state.selectedTag,
        environment: state.selectedEnvironment
      })
    })
    if (result.success) {
      setState((prev) => ({
        ...prev,
        loading: false,
        success: true
      }))
      setTimeout(() => {
        setState((prev) => ({
          ...prev,
          success: false,
          selectedAction: '',
          selectedTag: '',
          selectedEnvironment: '',
          tags: [],
          resetKey: prev.resetKey + 1
        }))
      }, 2000)
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: result.data
      }))
    }
  }

  function handleActionChange(name, value) {
    setState((prev) => ({
      ...prev,
      selectedAction: value,
      selectedTag: '',
      selectedEnvironment: '',
      tags: [],
      error: null
    }))

    if (value === 'github_deployment') {
      loadGitHubTags()
    }
  }

  function handleTagChange(name, value) {
    setState((prev) => ({ ...prev, selectedTag: value, error: null }))
  }

  function handleEnvironmentChange(name, value) {
    setState((prev) => ({ ...prev, selectedEnvironment: value, error: null }))
  }

  function handleCancel() {
    setState((prev) => ({
      ...prev,
      selectedAction: '',
      selectedTag: '',
      selectedEnvironment: '',
      tags: [],
      error: null,
      resetKey: prev.resetKey + 1
    }))
  }

  function handleSubmit() {
    if (state.selectedAction === 'github_deployment') {
      createGitHubDeployment()
    }
  }

  const actionOptions = state.actions.map((action) => ({
    label: action.name,
    value: action.id
  }))

  const tagOptions = state.tags
    .slice()
    .reverse()
    .map((tag) => ({
      label: tag,
      value: tag
    }))

  const environmentOptions = (project.environments || []).map((env) => ({
    label: env,
    value: env
  }))

  const canSubmit =
    state.selectedAction === 'github_deployment' &&
    state.selectedTag &&
    state.selectedEnvironment &&
    !state.loading

  return (
    <div className="space-y-4">
      {state.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Deployment created successfully
        </div>
      )}

      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {typeof state.error === 'string'
            ? state.error
            : state.error.title || 'An error occurred'}
          {state.error.detail && (
            <div className="text-sm mt-1">{state.error.detail}</div>
          )}
        </div>
      )}

      {state.actions.length === 0 && !state.loading && (
        <div className="text-gray-500 text-center py-4">
          No actions are currently available for this project
        </div>
      )}

      {state.actions.length > 0 && (
        <>
          <div>
            <label
              htmlFor="field-action"
              className="block text-sm font-medium text-gray-700 mb-1">
              Select an action
            </label>
            <Select
              key={state.resetKey}
              name="action"
              placeholder="Choose an action..."
              options={actionOptions}
              value={state.selectedAction}
              onChange={handleActionChange}
              disabled={state.loading}
            />
          </div>

          {state.selectedAction === 'github_deployment' && (
            <>
              <div>
                <label
                  htmlFor="field-tag"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Select a tag
                </label>
                {state.tags.length === 0 && state.loading && (
                  <div className="text-gray-500 text-sm">Loading tags...</div>
                )}
                {state.tags.length > 0 && (
                  <Select
                    name="tag"
                    placeholder="Choose a tag..."
                    options={tagOptions}
                    value={state.selectedTag}
                    onChange={handleTagChange}
                    disabled={state.loading}
                  />
                )}
              </div>

              <div>
                <label
                  htmlFor="field-environment"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Select an environment
                </label>
                <Select
                  name="environment"
                  placeholder="Choose an environment..."
                  options={environmentOptions}
                  value={state.selectedEnvironment}
                  onChange={handleEnvironmentChange}
                  disabled={state.loading}
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <Button
                  className="btn-green"
                  onClick={handleSubmit}
                  disabled={!canSubmit}>
                  Create Deployment
                </Button>
                <Button className="btn-white" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

ActionRunner.propTypes = {
  project: PropTypes.object.isRequired
}

export { ActionRunner }
