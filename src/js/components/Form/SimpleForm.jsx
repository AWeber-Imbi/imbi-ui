import PropTypes from 'prop-types'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, Button } from '..'
import { Field } from './Field'

function SimpleForm({
  children,
  errorMessage = null,
  onCancel,
  onSubmit,
  ready = false,
  saving = false,
  submitButtonText = null,
  submitSavingText = null
}) {
  const { t } = useTranslation()
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}>
      {errorMessage !== null && (
        <Alert className="mb-3" level="error">
          {errorMessage}
        </Alert>
      )}
      {children}
      <div className="mt-5 sm:mt-6 text-right pt-5 space-x-3">
        <Button
          className={'btn-white'}
          disabled={saving === true}
          onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          className={'btn-green'}
          disabled={ready === false || saving === true}
          type="submit">
          {saving
            ? submitSavingText
              ? submitSavingText
              : t('common.saving')
            : submitButtonText
            ? submitButtonText
            : t('common.save')}
        </Button>
      </div>
    </form>
  )
}

SimpleForm.propTypes = {
  children: PropTypes.arrayOf(Field),
  errorMessage: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  ready: PropTypes.bool.isRequired,
  saving: PropTypes.bool.isRequired,
  submitButtonText: PropTypes.string,
  submitSavingText: PropTypes.string
}
export { SimpleForm }
