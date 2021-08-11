import { Dialog } from '@headlessui/react'
import PropTypes from 'prop-types'
import React from 'react'

class Body extends React.PureComponent {
  render() {
    return (
      <Dialog.Description className={`${this.props.className}`}>
        {this.props.children}
      </Dialog.Description>
    )
  }
}

Body.defaultProps = {
  className: 'text-gray-500'
}

Body.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.string,
    PropTypes.element
  ]).isRequired,
  className: PropTypes.string
}
export { Body }
