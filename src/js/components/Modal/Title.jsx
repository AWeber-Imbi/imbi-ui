import { Dialog } from '@headlessui/react'
import PropTypes from 'prop-types'
import React from 'react'

import { Icon } from '..'

function Title({ children, icon, onClose, showClose = false }) {
  return (
    <Dialog.Title>
      <div className="text-xl text-gray-900 pb-2 mb-5">
        {icon && <Icon className="mr-2" icon={icon} />}
        {children}
      </div>
      {showClose && (
        <div className="absolute top-3 right-6">
          <button
            className="text-gray-400 hover:text-blue-700"
            onClick={onClose}>
            <Icon icon="fas times-circle" />
          </button>
        </div>
      )}
    </Dialog.Title>
  )
}

Title.propTypes = {
  children: PropTypes.string.isRequired,
  icon: PropTypes.string,
  onClose: PropTypes.func,
  showClose: PropTypes.bool
}
export { Title }
