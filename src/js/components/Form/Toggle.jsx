import PropTypes from 'prop-types'
import React from 'react'
import { useTranslation } from 'react-i18next'

function Toggle({
  name,
  className = '',
  disabled = false,
  onChange,
  readOnly = false,
  title,
  value = false
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      className={`${
        value ? 'bg-blue-600' : 'bg-gray-400'
      } relative inline-flex flex-shrink-0 h-5 w-9 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${className}`}
      aria-pressed="false"
      disabled={disabled || readOnly}
      onClick={(event) => {
        event.preventDefault()
        onChange(name, !value)
      }}
      title={
        title !== undefined
          ? title
          : value
          ? t('common.turnOff')
          : t('common.turnOn')
      }>
      <span className="sr-only">
        Toggle {value ? t('common.off') : t('common.on')}
      </span>
      <span
        aria-hidden="true"
        className={`${
          value ? 'translate-x-4' : 'translate-x-0'
        } pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
      />
    </button>
  )
}

Toggle.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  title: PropTypes.string,
  value: PropTypes.bool
}
export { Toggle }
