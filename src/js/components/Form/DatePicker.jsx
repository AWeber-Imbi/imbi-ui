import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'

function DatePicker({
  autoFocus,
  disabled,
  hasError,
  name,
  onChange,
  placeholder,
  readOnly,
  required,
  value
}) {
  const [hasFocus, setHasFocus] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (autoFocus === true) {
      ref.current.focus()
    }
  }, [])
  return (
    <input
      className={
        'form-input' +
        (hasFocus === false && hasError === true ? ' border-red-700' : '') +
        (disabled || readOnly ? ' cursor-not-allowed' : '')
      }
      type="date"
      defaultValue={value}
      disabled={disabled}
      id={'field-' + name}
      name={name}
      onBlur={(event) => {
        event.preventDefault()
        setHasFocus(false)
        if (onChange !== undefined)
          onChange(name, event.target.value === '' ? null : event.target.value)
      }}
      onChange={(event) => {
        event.preventDefault()
        if (onChange !== undefined)
          onChange(name, event.target.value === '' ? null : event.target.value)
      }}
      onFocus={(event) => {
        event.preventDefault()
        setHasFocus(true)
      }}
      placeholder={placeholder}
      readOnly={readOnly}
      ref={ref}
      required={required}
    />
  )
}
DatePicker.defaultProps = {
  autoFocus: false,
  disabled: false,
  hasError: false,
  readOnly: false,
  required: false
}
DatePicker.propTypes = {
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  hasError: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  value: PropTypes.string
}
export { DatePicker }
