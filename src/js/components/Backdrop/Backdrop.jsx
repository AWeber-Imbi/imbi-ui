import PropTypes from 'prop-types'
import React from 'react'

function Backdrop({ children, wait = false }) {
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 cursor-not-allowed">
      <div
        className={
          (wait ? 'cursor-wait ' : '') +
          'flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'
        }>
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" />
        </div>
        {children}
      </div>
    </div>
  )
}

Backdrop.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.string,
    PropTypes.element
  ]),
  wait: PropTypes.bool
}
export { Backdrop }
