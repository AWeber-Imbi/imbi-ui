import PropTypes from 'prop-types'

export const jsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    dependency_id: {
      type: 'number'
    }
  },
  additionalProperties: false,
  required: ['dependency_id']
}

export const propTypes = {
  dependency_id: PropTypes.number.isRequired
}
