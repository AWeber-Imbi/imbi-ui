import { Dialog } from '@headlessui/react'
import PropTypes from 'prop-types'
import React from 'react'

import { Icon } from '..'

class Title extends React.PureComponent {
  render() {
    return (
      <Dialog.Title>
        <div className="text-xl text-gray-900 border-b border-gray-400 pb-2 mb-5">
          {this.props.icon && <Icon className="mr-2" icon={this.props.icon} />}
          {this.props.children}
        </div>
        {this.props.showClose && (
          <div className="absolute top-3 right-6">
            <button
              className="text-gray-400 hover:text-blue-700"
              onClick={this.props.onClose}>
              <Icon icon="fas times-circle" />
            </button>
          </div>
        )}
      </Dialog.Title>
    )
  }
}
Title.defaultProps = {
  showClose: false
}
Title.propTypes = {
  children: PropTypes.string.isRequired,
  icon: PropTypes.string,
  onClose: PropTypes.func,
  showClose: PropTypes.bool
}
export { Title }
