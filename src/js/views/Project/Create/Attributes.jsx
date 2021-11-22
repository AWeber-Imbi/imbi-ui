import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { default as slugify } from 'slugify'
import { useTranslation } from 'react-i18next'
import { validate } from 'jsonschema'

import { asOptions } from '../../../metadata'
import { Form } from '../../../components'
import { httpPost } from '../../../utils'
import { jsonSchema } from '../../../schema/Project'

import { emptyAttributes } from './Reducer'
import { Context } from '../../../state'

function Attributes({ localState, localDispatch }) {
  const { t } = useTranslation()
  const [globalState] = useContext(Context)
  const [errors, setErrors] = useState({})

  // Save Project / Attributes
  useEffect(() => {
    async function saveAttributes() {
      let result = await httpPost(
        globalState.fetch,
        new URL('/projects', globalState.baseURL),
        localState.attributes
      )
      if (result.success === true) {
        localDispatch({ type: 'SET_PROJECT_ID', payload: result.data.id })
        localDispatch({ type: 'SET_SAVED_ATTRIBUTES', payload: true })
      } else {
        localDispatch({ type: 'SET_SAVING_ATTRIBUTES', payload: false })
        localDispatch({ type: 'SET_ERROR_MESSAGE', payload: result.data })
        localDispatch({ type: 'SET_IS_SAVING', payload: false })
      }
    }
    if (
      localState.isSaving &&
      localState.saved.attributes === false &&
      localState.saving.attributes === false
    ) {
      saveAttributes()
    }
  }, [localState.isSaving])

  function onChange(key, value) {
    if (value !== localState.attributes[key]) {
      const formValues = { ...localState.attributes, [key]: value }
      if (key === 'name') formValues.slug = slugify(value).toLowerCase()
      const result = validate(formValues, jsonSchema)
      const newErrors = { ...emptyAttributes }
      if (result.errors.length > 0) {
        result.errors.map((err) => {
          err.path.map((field) => {
            if (formValues[field] !== null) {
              newErrors[field] = err.message
            }
          })
        })
        localDispatch({
          type: 'SET_ATTRIBUTES_READY',
          payload: false
        })
      } else {
        localDispatch({
          type: 'SET_ATTRIBUTES_READY',
          payload: true
        })
      }
      localDispatch({
        type: 'SET_ATTRIBUTES',
        payload: formValues
      })
      setErrors({ newErrors })
    }
  }
  return (
    <Form.Section
      name="attributes"
      title={t('project.projectAttributes')}
      firstSection={true}
    >
      <Form.Field
        title={t('project.namespace')}
        name="namespace_id"
        type="select"
        autoFocus={true}
        castTo="number"
        options={asOptions(globalState.metadata.namespaces)}
        onChange={onChange}
        errorMessage={errors.namespace_id}
        required={true}
      />
      <Form.Field
        title={t('project.projectType')}
        name="project_type_id"
        type="select"
        castTo="number"
        options={asOptions(globalState.metadata.projectTypes)}
        onChange={onChange}
        errorMessage={errors.project_type_id}
        required={true}
      />
      <Form.Field
        title={t('project.name')}
        name="name"
        type="text"
        errorMessage={errors.name}
        onChange={onChange}
        required={true}
      />
      <Form.Field
        title={t('common.slug')}
        name="slug"
        type="text"
        description={t('common.slugDescription')}
        errorMessage={errors.slug}
        onChange={onChange}
        required={true}
        value={localState.attributes.slug}
      />
      <Form.Field
        title={t('common.description')}
        name="description"
        description={t('project.descriptionDescription')}
        type="textarea"
        onChange={onChange}
        errorMessage={errors.description}
      />
      <Form.Field
        title={t('project.environments')}
        name="environments"
        type="select"
        multiple={true}
        options={asOptions(globalState.metadata.environments, 'name', 'name')}
        onChange={onChange}
        errorMessage={errors.environments}
      />
    </Form.Section>
  )
}
Attributes.propTypes = {
  localDispatch: PropTypes.func,
  localState: PropTypes.object
}
export { Attributes }
