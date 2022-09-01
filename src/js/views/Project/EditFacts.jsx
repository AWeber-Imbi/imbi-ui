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

function convertFactToFieldValue(fact, factType) {
  if (factType.data_type === 'timestamp') return ISO8601ToDatetimeLocal(fact)
  return fact
}

function EditFacts({ projectId, facts, factTypes, onEditFinished }) {
  const [globalState] = useContext(Context)
  const factTypeById = Object.fromEntries(factTypes.map((t) => [t.id, t]))
  const originalValues = Object.fromEntries(
    facts.map((fact) => {
      return [
        fact.fact_type_id,
        convertFactToFieldValue(fact.value, factTypeById[fact.fact_type_id])
      ]
    })
  )
  const { t } = useTranslation()
  const [state, setState] = useState({
    errors: Object.fromEntries(
      facts.map((fact) => {
        return [fact.fact_type_id, null]
      })
    ),
    errorMessage: null,
    fieldValues: originalValues,
    ready: false,
    saving: false
  })

  useEffect(() => {
    let ready = false
    Object.entries(state.fieldValues).forEach((value) => {
      if (value[1] !== originalValues[value[0]] && ready === false) ready = true
    })
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
    for (let [factTypeId, value] of Object.entries(state.fieldValues)) {
      if (value !== originalValues[factTypeId]) {
        const fact =
          factTypeById[factTypeId].data_type === 'timestamp' && value
            ? new Date(value).toISOString()
            : value
        payload.push({ fact_type_id: Number(factTypeId), value: fact })
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
              value = Number(value)
            } else if (factType.data_type === 'decimal') {
              fieldType = 'number'
              step = '0.01'
              value = Number(value)
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
                disabled={factType.ui_options.includes('read-only')}
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
