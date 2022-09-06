import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'

function DateTimePicker({
  autoFocus,
  disabled,
  hasError,
  name,
  onChange,
  placeholder,
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
        (disabled ? ' cursor-not-allowed' : '')
      }
      type="datetime-local"
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
      ref={ref}
      required={required}
    />
  )
}
DateTimePicker.defaultProps = {
  autoFocus: false,
  disabled: false,
  hasError: false,
  required: false
}
DateTimePicker.propTypes = {
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  hasError: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  value: PropTypes.string
}
export { DateTimePicker }
