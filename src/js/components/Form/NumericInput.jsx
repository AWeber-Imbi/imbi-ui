import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'

function NumericInput({
  autoFocus = false,
  disabled = false,
  hasError = false,
  maximum,
  minimum,
  name,
  onChange,
  placeholder,
  readOnly = false,
  required = false,
  step = '1',
  value
}) {
  const [hasFocus, setHasFocus] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (autoFocus === true) {
      ref.current.focus()
    }
  }, [])
  const parse = parseFloat(step) % 1 === 0 ? parseInt : (i) => i
  return (
    <input
      autoComplete={name}
      className={
        'form-input' +
        (hasFocus === false && hasError === true ? ' border-red-700' : '') +
        (disabled ? ' cursor-not-allowed' : '')
      }
      disabled={disabled}
      value={value !== undefined && value !== null ? value.toString() : ''}
      id={'field-' + name}
      max={maximum}
      min={minimum}
      name={name}
      onBlur={(event) => {
        event.preventDefault()
        if (onChange !== undefined)
          onChange(
            name,
            event.target.value === '' ? null : parse(event.target.value)
          )
        setHasFocus(false)
      }}
      onChange={(event) => {
        event.preventDefault()
        if (onChange !== undefined)
          onChange(
            name,
            event.target.value === '' ? null : parse(event.target.value)
          )
      }}
      onFocus={(event) => {
        event.preventDefault()
        setHasFocus(true)
      }}
      placeholder={placeholder}
      readOnly={readOnly}
      ref={ref}
      required={required}
      step={step}
      type="number"
    />
  )
}

NumericInput.propTypes = {
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  hasError: PropTypes.bool,
  maximum: PropTypes.number,
  minimum: PropTypes.number,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  step: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}
export { NumericInput }
