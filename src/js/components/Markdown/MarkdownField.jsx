import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Markdown } from './Markdown'
import { TextArea } from '../Form/TextArea'
import { Toggle } from '../Form/Toggle'

export const MarkdownField = ({
  autoFocus = false,
  disabled = false,
  errorMessage = null,
  name,
  onChange,
  placeholder,
  readOnly = false,
  required = false,
  value
}) => {
  const className = 'overflow-auto h-[25vh] form-input'
  const [renderMarkdown, setRenderMarkdown] = useState(false)
  return (
    <div>
      {renderMarkdown ? (
        <Markdown className={className}>{value}</Markdown>
      ) : (
        <TextArea
          autoFocus={autoFocus}
          className={className}
          disabled={disabled}
          hasError={errorMessage && errorMessage.length > 0}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          required={required}
          value={value}
        />
      )}
      <div className="flex">
        <span className="grow"></span>
        <label className="text-sm mr-1 font-medium text-gray-700">
          Preview
        </label>
        <Toggle
          onChange={(n, value) => {
            setRenderMarkdown(value)
          }}
          name="renderMarkdown"
          title="Preview"
          value={renderMarkdown}
        />
      </div>
    </div>
  )
}

MarkdownField.propTypes = {
  autoFocus: PropTypes.bool,
  disabled: PropTypes.bool,
  errorMessage: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  required: PropTypes.bool,
  value: PropTypes.string
}
