import PropTypes from 'prop-types'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Icon, Modal } from '..'

function SavingModal({ title, steps, onSaveComplete }) {
  const { t } = useTranslation()
  const completed = steps.every((element) => element.isComplete === true)
  return (
    <Modal>
      <Modal.Title>{title}</Modal.Title>
      <div className="text-gray-500">
        <ul className="m-5 mb-0">
          {steps.map((step, index) => {
            let icon = step.isComplete ? 'fas check-circle' : 'fas circle'
            let label = step.isComplete
              ? step.completedLabel
              : step.pendingLabel
            let status = step.isComplete ? 'text-green-500' : 'text-gray-300'
            return (
              <li className="text-gray-500" key={'saving-step-' + index}>
                {index > 0 && (
                  <div className="m-2 border-l border-gray-300 h-3">&nbsp;</div>
                )}
                <div>
                  <Icon icon={icon} className={`mr-2 ${status}`} />
                  {label}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
      <Modal.Footer>
        <Button
          className={completed ? 'btn-white' : 'btn-disabled'}
          disabled={!completed}
          key="modal-close"
          onClick={onSaveComplete}>
          {t('common.close')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

SavingModal.propTypes = {
  title: PropTypes.string.isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.exact({
      isComplete: PropTypes.bool.isRequired,
      pendingLabel: PropTypes.string.isRequired,
      completedLabel: PropTypes.string.isRequired
    })
  ),
  onSaveComplete: PropTypes.func
}

export { SavingModal }
