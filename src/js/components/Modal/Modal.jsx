import PropTypes from 'prop-types'
import React from 'react'
import { Dialog } from '@headlessui/react'

import { Title } from './Title'
import { Body } from './Body'
import { Footer } from './Footer'

class Modal extends React.PureComponent {
  constructor(props) {
    super(props)
    this.dialogRef = React.createRef()
  }

  render() {
    return (
      <Dialog
        initialFocus={this.dialogRef}
        open={true}
        onClose={() => {
          this.props.onClose && this.props.onClose()
        }}
        className="fixed font-sans z-10 inset-0 overflow-y-auto text-base">
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          <div
            className={`align-bottom sm:align-middle bg-white cursor-default focus:outline-none focus:ring-0 inline-block max-w-2xl sm:my-8 overflow-hidden px-4 py-5 rounded-lg sm:p-6 shadow-xl text-left transform transition-all w-full ${this.props.className}`}
            ref={this.dialogRef}>
            {this.props.children}
          </div>
        </div>
      </Dialog>
    )
  }
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
  focus: PropTypes.object,
  onClose: PropTypes.func
}
export { Modal }
