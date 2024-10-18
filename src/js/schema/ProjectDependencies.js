import PropTypes from 'prop-types'

export const jsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    dependency: {
      type: 'object',
      properties: {
        namespace_id: { type: 'number' },
        project_id: { type: 'number' },
        project_type: { type: 'number' }
      },
      required: ['project_id']
    }
  },
  additionalProperties: false,
  required: ['dependency']
}

export const propTypes = {
  dependency: PropTypes.object.isRequired
}
