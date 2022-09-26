import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { Markdown } from './Markdown'
import { TextArea } from '../Form/TextArea'
import { Toggle } from '../Form/Toggle'

export const MarkdownField = (props) => {
  const className = 'overflow-auto h-[25vh] form-input'
  const [renderMarkdown, changeRenderMarkdown] = useState(false)
  return (
    <div>
      {renderMarkdown ? (
        <Markdown className={className}>{props.value}</Markdown>
      ) : (
        <TextArea
          autoFocus={props.autoFocus}
          className={className}
          disabled={props.disabled}
          hasError={props.errorMessage && props.errorMessage.length > 0}
          name={props.name}
          onChange={props.onChange}
          placeholder={props.placeholder}
          readOnly={props.readOnly}
          required={props.required}
          value={props.value}
        />
      )}
      <div className="flex">
        <span className="grow"></span>
        <label className="text-sm mr-1 font-medium text-gray-700">
          Preview
        </label>
        <Toggle
          onChange={(n, value) => {
            changeRenderMarkdown(value)
          }}
          name="renderMarkdown"
          title="Preview"
          value={renderMarkdown}
        />
      </div>
    </div>
  )
}
MarkdownField.defaultProps = {
  autoFocus: false,
  disabled: false,
  errorMessage: null,
  readOnly: false,
  required: false,
  rows: 3
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
  rows: PropTypes.number,
  value: PropTypes.string
}
