import PropTypes from 'prop-types'

export const jsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    id: {
      type: 'number'
    },
    role_arn: {
      type: 'string'
    },
    environment: {
      type: 'string',
      minLength: 3
    },
    namespace_id: {
      type: 'number'
    },
    created_at: {
      type: 'string',
      format: 'date-time'
    },
    created_by: {
      type: 'string'
    }
  },
  additionalProperties: false,
  required: ['role_arn', 'environment', 'namespace_id']
}

export const propTypes = {
  id: PropTypes.number.isRequired,
  description: PropTypes.string,
  icon_class: PropTypes.string
}
