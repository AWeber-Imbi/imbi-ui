import PropTypes from 'prop-types'
import React from 'react'

import { IconSelect } from './IconSelect'
import { Markdown } from '../'
import { NumericInput } from './NumericInput'
import { Select } from './Select'
import { SelectOptions } from '../../schema/PropTypes'
import { TextInput } from './TextInput'
import { TextArea } from './TextArea'
import { Toggle } from './Toggle'
import { DatePicker } from './DatePicker'
import { DateTimePicker } from './DateTimePicker'
import { MarkdownField } from '../Markdown/MarkdownField'
import { ProjectPicker } from './ProjectPicker'
import { PrefixTextInput } from './PrefixTextInput'

function Field({
  autoFocus,
  castTo,
  className,
  description,
  disabled,
  errorMessage,
  maximum,
  minimum,
  multiple,
  name,
  onChange,
  onError,
  options,
  placeholder,
  readOnly,
  required,
  step,
  title,
  type,
  value,
  prefix
}) {
  if (type === 'hidden') {
    if (value === null) return null
    return <input type="hidden" name={name} value={value} />
  }
  return (
    <div className={`grid grid-cols-3 gap-4 items-start ${className}`}>
      <label
        htmlFor={'field-' + name}
        className="block text-sm mt-2 font-medium text-gray-700">
        {title}
        {required === true && <sup>*</sup>}
      </label>
      <div className="col-span-2">
        {type === 'icon' && (
          <IconSelect
            autoFocus={autoFocus}
            disabled={disabled}
            hasError={errorMessage !== null}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
          />
        )}
        {type === 'number' && (
          <NumericInput
            autoFocus={autoFocus}
            disabled={disabled}
            hasError={errorMessage !== null}
            maximum={maximum}
            minumum={minimum}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            step={step}
            value={value}
          />
        )}
        {type === 'select' && (
          <Select
            autoFocus={autoFocus}
            castTo={castTo}
            disabled={disabled}
            hasError={errorMessage !== null}
            multiple={multiple}
            name={name}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
          />
        )}
        {(type === 'email' || type === 'text' || type === 'url') && (
          <TextInput
            autoFocus={autoFocus}
            disabled={disabled}
            hasError={errorMessage !== null}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            type={type}
            value={value}
          />
        )}
        {type === 'prefix-text' && (
          <PrefixTextInput
            autoFocus={autoFocus}
            disabled={disabled}
            hasError={errorMessage !== null}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
            prefix={prefix}
          />
        )}
        {type === 'markdown' && (
          <MarkdownField
            autoFocus={autoFocus}
            description={description}
            disabled={disabled}
            errorMessage={errorMessage}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
          />
        )}
        {type === 'textarea' && (
          <TextArea
            autoFocus={autoFocus}
            disabled={disabled}
            hasError={errorMessage !== null}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
          />
        )}
        {type === 'toggle' && (
          <Toggle
            name={name}
            className="mt-2"
            disabled={disabled}
            onChange={onChange}
            readOnly={readOnly}
            value={value}
          />
        )}
        {type === 'date' && (
          <DatePicker
            autoFocus={autoFocus}
            disabled={disabled}
            hasError={errorMessage !== null}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
          />
        )}
        {type === 'datetime' && (
          <DateTimePicker
            autoFocus={autoFocus}
            disabled={disabled}
            hasError={errorMessage !== null}
            name={name}
            onChange={onChange}
            placeholder={placeholder}
            readOnly={readOnly}
            required={required}
            value={value}
          />
        )}
        {type === 'project' && (
          <ProjectPicker
            disabled={disabled}
            name={name}
            readOnly={readOnly}
            required={required}
            value={value}
            onChange={onChange}
            onError={onError}
          />
        )}
        {errorMessage !== null && (
          <p className="ml-2 mt-2 text-sm text-red-700 col-span-2">
            {errorMessage}
          </p>
        )}
        {errorMessage === null && description !== undefined && (
          <Markdown className="ml-2 mt-2 text-sm text-gray-500 col-span-2">
            {description}
          </Markdown>
        )}
      </div>
    </div>
  )
}

Field.defaultProps = {
  autoFocus: false,
  className: '',
  disabled: false,
  errorMessage: null,
  multiple: false,
  required: false
}
Field.propTypes = {
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  castTo: PropTypes.oneOf(['number']),
  className: PropTypes.string,
  description: PropTypes.string,
  errorMessage: PropTypes.string,
  maximum: PropTypes.number,
  minimum: PropTypes.number,
  multiple: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onError: PropTypes.func,
  options: SelectOptions,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  step: PropTypes.string,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  type: PropTypes.oneOf([
    'email',
    'hidden',
    'icon',
    'markdown',
    'number',
    'select',
    'text',
    'textarea',
    'toggle',
    'url',
    'date',
    'datetime',
    'project',
    'prefix-text'
  ]).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
    PropTypes.string,
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.arrayOf(PropTypes.number)
  ]),
  prefix: PropTypes.string
}
export { Field }
