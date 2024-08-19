import PropTypes from 'prop-types'
import React, { useRef } from 'react'
import { Dialog } from '@headlessui/react'

import { Title } from './Title'
import { Body } from './Body'
import { Footer } from './Footer'

function Modal({ children, className, onClose }) {
  const dialogRef = useRef(null)

  return (
    <Dialog
      initialFocus={dialogRef}
      open={true}
      onClose={() => {
        onClose?.()
      }}
      className="fixed font-sans z-10 inset-0 overflow-y-auto text-base">
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <div
          className={`align-bottom sm:align-middle bg-white cursor-default focus:outline-none focus:ring-0 inline-block max-w-2xl sm:my-8 overflow-hidden px-4 py-5 rounded-lg sm:p-6 shadow-xl text-left transform transition-all w-full ${className}`}
          ref={dialogRef}>
          {children}
        </div>
      </div>
    </Dialog>
  )
}
Modal.Title = Title
Modal.Body = Body
Modal.Footer = Footer
Modal.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.string,
    PropTypes.element
  ]).isRequired,
  className: PropTypes.string,
  onClose: PropTypes.func
}
export { Modal }
