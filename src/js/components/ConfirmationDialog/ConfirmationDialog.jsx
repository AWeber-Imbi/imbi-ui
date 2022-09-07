import PropTypes from 'prop-types'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Modal } from '..'

const confirmButtonClassName = {
  info: 'btn-blue',
  warning: 'btn-yellow',
  error: 'btn-red',
  success: 'btn-green'
}

function ConfirmationDialog({
  title,
  children,
  confirmationButtonText,
  mode,
  onCancel,
  onConfirm
}) {
  const { t } = useTranslation()
  return (
    <Modal onClose={onCancel}>
      <Modal.Title onClose={onCancel} showClose={true}>
        {title}
      </Modal.Title>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer className="flex-reverse">
        <button
          className={confirmButtonClassName[mode]}
          onClick={(e) => {
            onConfirm(e)
          }}
          role="button"
          type="button">
          {confirmationButtonText}
        </button>
        <button
          className="btn-white mr-3"
          onClick={(e) => {
            onCancel(e)
          }}
          role="button"
          type="button">
          {t('common.cancel')}
        </button>
      </Modal.Footer>
    </Modal>
  )
}

ConfirmationDialog.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element,
    PropTypes.string
  ]).isRequired,
  confirmationButtonText: PropTypes.string.isRequired,
  mode: PropTypes.oneOf(['info', 'warning', 'error', 'success']).isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
}

export { ConfirmationDialog }
