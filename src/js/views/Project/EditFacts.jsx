import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, ErrorBoundary, Form } from '../../components'
import { Context } from '../../state'
import { httpPost } from '../../utils'

function ISO8601ToDatetimeLocal(isoDate) {
  if (!isoDate) return isoDate
  const msOffset = new Date().getTimezoneOffset() * 60 * 1000
  return new Date(new Date(isoDate).getTime() - msOffset)
    .toISOString()
    .slice(0, -1)
}

function isDifferent(factValue, fieldValue, factDataType) {
  if (factValue === fieldValue) {
    return false
  }

  function normalizedFact() {
    if (factDataType === 'timestamp') return ISO8601ToDatetimeLocal(factValue)
    if (factDataType === 'decimal') return parseFloat(factValue)
    return factValue
  }

  function normalizedField() {
    if (factDataType === 'decimal') return parseFloat(fieldValue)
    return fieldValue
  }

  return normalizedFact() !== normalizedField()
}

function convertFieldToFact(value, factDataType) {
  if (factDataType === 'timestamp') return new Date(value).toISOString()
  if (factDataType === 'decimal') return parseFloat(value).toFixed(2)
  return value
}

function convertFactToField(value, factDataType) {
  if (factDataType === 'timestamp') return ISO8601ToDatetimeLocal(value)
  return value
}

function EditFacts({ projectId, facts, factTypes, onEditFinished }) {
  const [globalState] = useContext(Context)
  const factTypeById = Object.fromEntries(factTypes.map((t) => [t.id, t]))
  const factByFactTypeId = Object.fromEntries(
    facts.map((fact) => [fact.fact_type_id, fact])
  )
  const { t } = useTranslation()
  const [state, setState] = useState({
    errors: Object.fromEntries(
      facts.map((fact) => {
        return [fact.fact_type_id, null]
      })
    ),
    errorMessage: null,
    fieldValues: Object.fromEntries(
      Object.entries(factByFactTypeId).map(([factTypeId, fact]) => [
        factTypeId,
        convertFactToField(fact.value, factTypeById[factTypeId].data_type)
      ])
    ),
    ready: false,
    saving: false
  })

  useEffect(() => {
    let ready = false
    for (const [factTypeId, fieldValue] of Object.entries(state.fieldValues)) {
      if (
        isDifferent(
          factByFactTypeId[factTypeId].value,
          fieldValue,
          factTypeById[factTypeId].data_type
        )
      ) {
        ready = true
        break
      }
    }
    if (state.ready !== ready) setState({ ...state, ready: ready })
  }, [state.fieldValues])

  function onChange(name, value) {
    const key = parseInt(name.split('-')[1])
    if (state.fieldValues[key] !== value)
      setState({
        ...state,
        fieldValues: {
          ...state.fieldValues,
          [key]: value !== null ? value.toString() : null
        }
      })
  }

  async function onSubmit() {
    setState({ ...state, saving: true })
    const payload = []
    for (const [factTypeId, fieldValue] of Object.entries(state.fieldValues)) {
      if (
        isDifferent(
          factByFactTypeId[factTypeId].value,
          fieldValue,
          factTypeById[factTypeId].data_type
        )
      ) {
        payload.push({
          fact_type_id: Number(factTypeId),
          value: convertFieldToFact(
            fieldValue,
            factTypeById[factTypeId].data_type
          )
        })
      }
    }
    if (payload.length > 0) {
      const url = new URL(`/projects/${projectId}/facts`, globalState.baseURL)
      const result = await httpPost(globalState.fetch, url, payload)
      if (result.success === false) {
        console.error(`Error: ${result.data}`)
      }
    }
    onEditFinished(true)
  }

  return (
    <ErrorBoundary>
      <Card className="flex flex-col h-full">
        <h2 className="font-medium mb-2">{t('project.editFacts')}</h2>
        <Form.SimpleForm
          errorMessage={state.errorMessage}
          onCancel={onEditFinished}
          onSubmit={onSubmit}
          ready={state.ready}
          saving={state.saving}>
          {factTypes.map((factType) => {
            let step = undefined
            let fieldType = 'text'
            let value = state.fieldValues[factType.id]
            if (factType.data_type === 'boolean') {
              fieldType = 'toggle'
              value = value === 'true'
            } else if (factType.data_type === 'integer') {
              fieldType = 'number'
              step = '1'
            } else if (factType.data_type === 'decimal') {
              fieldType = 'number'
              step = '0.01'
            } else if (factType.data_type === 'date') {
              fieldType = 'date'
            } else if (factType.data_type === 'timestamp') {
              fieldType = 'datetime'
            } else if (factType.fact_type === 'enum') fieldType = 'select'
            const name = `fact-${factType.id}`
            return (
              <Form.Field
                key={name}
                name={name}
                title={factType.name}
                type={fieldType}
                description={factType.description}
                errorMessage={state.errors[factType.id]}
                options={
                  factType.enum_values === null
                    ? undefined
                    : factType.enum_values.map((value) => {
                        return { label: value, value: value }
                      })
                }
                maximum={factType.max_value}
                minimum={factType.min_value}
                onChange={onChange}
                readOnly={
                  factType.ui_options &&
                  factType.ui_options.includes('read-only')
                }
                step={step}
                value={value}
              />
            )
          })}
        </Form.SimpleForm>
      </Card>
    </ErrorBoundary>
  )
}
EditFacts.propTypes = {
  projectId: PropTypes.number.isRequired,
  facts: PropTypes.arrayOf(PropTypes.object).isRequired,
  factTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEditFinished: PropTypes.func.isRequired
}
export { EditFacts }
