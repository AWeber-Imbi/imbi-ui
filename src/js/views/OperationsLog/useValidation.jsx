import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { validate as jsonschemaValidate } from 'jsonschema'
import { jsonSchema } from '../../schema/OperationsLog'

export function useValidation() {
  const [errors, setErrors] = useState({})
  const { t } = useTranslation()

  function errorMessage(field) {
    switch (field) {
      case 'change_type':
        return t('operationsLog.validation.changeTypeError')
      case 'environment':
        return t('operationsLog.validation.environmentError')
      case 'recorded_at':
        return t('operationsLog.validation.recordedAtError')
      case 'completed_at':
        return t('operationsLog.validation.completedAtError')
      case 'description':
        return t('operationsLog.validation.descriptionError')
      case 'project':
        return t('operationsLog.validation.projectError')
      case 'version':
        return t('operationsLog.validation.versionError')
      case 'ticket_slug':
        return t('operationsLog.validation.ticketSlugError')
      case 'link':
        return t('operationsLog.validation.linkError')
      case 'notes':
        return t('operationsLog.validation.notesError')
      default:
        return t('error.title')
    }
  }

  function validate(values) {
    const newErrors = {}
    const validation = jsonschemaValidate(values, jsonSchema)
    for (const error of validation.errors) {
      for (const path of error.path) {
        newErrors[path] = errorMessage(path)
      }
    }
    return newErrors
  }

  return [errors, { validate, setErrors }]
}
