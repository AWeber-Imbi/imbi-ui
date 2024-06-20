import PropTypes from 'prop-types'
import React from 'react'

function Checkbox({ name, label, onChange, value }) {
  return (
    <>
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            id={name}
            aria-describedby={`${name}-description`}
            name={name}
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            checked={value}
            onChange={() => onChange(name, !value)}
          />
        </div>
        <label htmlFor={name} className="text-gray-900 ml-3 text-sm leading-6">
          {label}
        </label>
      </div>
    </>
  )
}

Checkbox.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.bool.isRequired
}
export { Checkbox }
