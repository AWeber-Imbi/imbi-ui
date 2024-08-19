import PropTypes from 'prop-types'
import React from 'react'

import { Button } from '../'

function Footer({ children, className, closeText, onClose }) {
  return (
    <div className={`mt-5 sm:mt-6 text-right pt-5 space-x-3 ${className}`}>
      {children}
      {onClose !== undefined && closeText !== undefined && (
        <Button key="modal-close" onClick={onClose}>
          {closeText}
        </Button>
      )}
    </div>
  )
}

Footer.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element
  ]),
  className: PropTypes.string,
  closeText: PropTypes.string,
  onClose: PropTypes.func
}
export { Footer }
