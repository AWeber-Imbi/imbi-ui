import PropTypes from 'prop-types'
import React, { Fragment } from 'react'

function Section({ name, title, firstSection, children }) {
  return (
    <Fragment>
      <div className={firstSection ? '' : 'pt-5'}>
        <h3 className="text-lg leading-6 font-medium mb-5">
          <a name={name}>{title}</a>
        </h3>
      </div>
      <div className="w-full space-y-5">{children}</div>
    </Fragment>
  )
}
Section.defaultProps = {
  firstSection: false
}
Section.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  firstSection: PropTypes.bool,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.element),
    PropTypes.element,
    PropTypes.string
  ])
}
export { Section }
