import PropTypes from 'prop-types'

export const jsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    id: { type: 'number' },
    content: { type: 'string' },
    created_by: { type: 'string' },
    project_id: { type: 'number' },
    updated_by: {
      oneOf: [{ type: 'string' }, { type: 'null' }]
    }
  },
  additionalProperties: false,
  required: ['content']
}

export const propTypes = {
  id: PropTypes.number.isRequired,
  content: PropTypes.string.isRequired,
  project_id: PropTypes.number.isRequired,
  created_by: PropTypes.string,
  updated_by: PropTypes.string
}
