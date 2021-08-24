import PropTypes from 'prop-types'
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Context } from '../../../state'
import { Form, Icon } from '../../../components'
import { httpPost, isURL } from '../../../utils'

async function saveLinks(globalState, projectID, values) {
  const linkURL = new URL(`/projects/${projectID}/links`, globalState.baseURL)
  if (Object.values(values).length > 0) {
    for (const [linkTypeID, url] of Object.entries(values)) {
      let result = await httpPost(globalState.fetch, linkURL, {
        project_id: projectID,
        link_type_id: parseInt(linkTypeID),
        url: url
      })
      if (result.success === false) return [false, result.status, result.data]
    }
    return [true, null]
  }
}
function Links({ localDispatch, localState }) {
  const { t } = useTranslation()
  const [errors, setErrors] = useState({})
  const [globalState] = useContext(Context)

  useEffect(() => {
    const hasLinks = Object.keys(localState.links).length > 0
    const valid = []
    Object.values(localState.links).forEach((value) => {
      valid.push(isURL(value))
    })
    const isReady = hasLinks === valid.filter((isValid) => isValid).length > 0
    localDispatch({ type: 'SET_LINKS_READY', payload: isReady })
  }, [localState.links])

  // State management for save Links && Urls
  useEffect(() => {
    if (localState.isSaving && localState.saved.attributes) {
      if (
        Object.keys(localState.links).length > 0 &&
        !localState.saved.links &&
        !localState.saving.links
      )
        localDispatch({ type: 'SET_SAVING_LINKS', payload: true })
    }
  }, [localState.saved.attributes])

  // Save Links
  useEffect(() => {
    async function localSaveLinks() {
      const result = await saveLinks(
        globalState,
        localState.projectId,
        localState.links
      )
      if (result[0]) {
        localDispatch({ type: 'SET_SAVED_LINKS', payload: true })
        localDispatch({ type: 'SET_SAVING_LINKS', payload: false })
      } else {
        localDispatch({ type: 'SET_SAVING_LINKS', payload: false })
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
      !localState.saved.links &&
      localState.saving.links
    ) {
      localSaveLinks()
    }
  }, [localState.saving.links])

  function onChange(key, value) {
    const linkTypeId = parseInt(key.substring(5).toString())
    const links = { ...localState.links }
    links[linkTypeId] = value
    if (value !== '') {
      const newErrors = { ...errors }
      if (isURL(value)) {
        newErrors[key] = null
        setErrors(newErrors)
      } else {
        newErrors[key] = 'Invalid URL'
        setErrors(newErrors)
      }
    } else {
      if (links[linkTypeId] !== undefined) delete links[linkTypeId]
    }
    localDispatch({
      type: 'SET_LINKS',
      payload: links
    })
  }
  return (
    <Form.Section name="links" title={t('project.projectLinks')}>
      {globalState.metadata.projectLinkTypes.map((linkType) => {
        if (!localState.automationLinks.has(linkType.id)) {
          const key = 'link-' + linkType.id
          return (
            <Form.Field
              title={
                <Fragment>
                  <Icon className="mr-2" icon={linkType.icon_class} />
                  {linkType.link_type}
                </Fragment>
              }
              key={key}
              name={key}
              type="url"
              onChange={onChange}
              errorMessage={errors[key]}
              value={
                localState.links[linkType.id] !== undefined
                  ? localState.links[linkType.id]
                  : ''
              }
            />
          )
        }
      })}
    </Form.Section>
  )
}
Links.defaultPropTypes = {
  includePrimaryRepository: true
}
Links.propTypes = {
  includePrimaryRepository: PropTypes.bool,
  localDispatch: PropTypes.func,
  localState: PropTypes.object
}
export { Links, saveLinks }
