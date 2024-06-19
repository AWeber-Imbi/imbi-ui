import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'

function PrefixTextInput({
  autoFocus,
  disabled,
  hasError,
  name,
  onChange,
  placeholder,
  readOnly,
  required,
  value,
  prefix
}) {
  const [hasFocus, setHasFocus] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (autoFocus === true) {
      ref.current.focus()
    }
  }, [])
  return (
    <div className="flex gap-0.5">
      <p className="text-sm shrink-0 self-center mb-2">{prefix}</p>
      <input
        autoComplete={name}
        className={
          'form-input pl-0.5' +
          (hasFocus === false && hasError === true ? ' border-red-700' : '') +
          (disabled || readOnly ? ' cursor-not-allowed' : '')
        }
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
        type="text"
        value={value !== null ? value : ''}
      />
    </div>
  )
}

PrefixTextInput.defaultProps = {
  autoFocus: false,
  disabled: false,
  hasError: false,
  readOnly: false,
  required: false
}
PrefixTextInput.propTypes = {
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  hasError: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  value: PropTypes.string,
  prefix: PropTypes.string.isRequired
}
export { PrefixTextInput }
