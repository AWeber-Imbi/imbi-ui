import PropTypes from 'prop-types'
import React from 'react'

import { Button } from '../'

class Footer extends React.PureComponent {
  render() {
    return (
      <div
        className={`mt-5 sm:mt-6 text-right border-t border-gray-400 pt-5 mt-5 space-x-3 ${this.props.className}`}
      >
        {this.props.children}
        {this.props.onClose !== undefined &&
          this.props.closeText !== undefined && (
            <Button key="modal-close" onClick={this.props.onClose}>
              {this.props.closeText}
            </Button>
          )}
      </div>
    )
  }
}
Footer.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element
  ]).isRequired,
  className: PropTypes.string,
  closeText: PropTypes.string,
  onClose: PropTypes.func
}
export { Footer }
