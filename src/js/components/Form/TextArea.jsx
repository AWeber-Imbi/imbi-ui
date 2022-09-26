import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'

function TextArea({
  autoFocus,
  className,
  disabled,
  hasError,
  name,
  onChange,
  placeholder,
  readOnly,
  required,
  rows,
  value
}) {
  const [hasFocus, setHasFocus] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (autoFocus === true) {
      ref.current.focus()
    }
  }, [])

  let uiClassName = 'form-input'
  if (className) {
    uiClassName += ` ${className}`
  }
  if (hasFocus === false && hasError === true) {
    uiClassName += ' border-red-700'
  }
  if (disabled || readOnly) {
    uiClassName += ' cursor-not-allowed'
  }

  return (
    <textarea
      className={uiClassName}
      defaultValue={value}
      disabled={disabled}
      id={'field-' + name}
      name={name}
      onBlur={(event) => {
        event.preventDefault()
        setHasFocus(false)
        if (onChange !== undefined) onChange(name, event.target.value)
      }}
      onChange={(event) => {
        event.preventDefault()
        if (onChange !== undefined) onChange(name, event.target.value)
      }}
      onFocus={(event) => {
        event.preventDefault()
        setHasFocus(true)
      }}
      placeholder={placeholder}
      readOnly={readOnly}
      ref={ref}
      required={required}
      rows={rows}
    />
  )
}
TextArea.defaultProps = {
  autoFocus: false,
  disabled: false,
  hasError: false,
  readOnly: false,
  required: false,
  rows: 3
}
TextArea.propTypes = {
  autoFocus: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  hasError: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  rows: PropTypes.number,
  value: PropTypes.string
}
export { TextArea }
