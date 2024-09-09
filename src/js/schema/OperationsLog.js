import PropTypes from 'prop-types'

export const jsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    id: { type: 'number' },
    recorded_at: { type: 'string', format: 'date-time' },
    recorded_by: { type: 'string' },
    completed_at: {
      oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }]
    },
    project_id: {
      oneOf: [{ type: 'number' }, { type: 'null' }]
    },
    environment: { type: 'string' },
    change_type: {
      type: 'string',
      pattern:
        '^(Configured|Decommissioned|Deployed|Migrated|Provisioned|Restarted|Rolled Back|Scaled|Upgraded)$'
    },
    description: {
      type: 'string',
      pattern: '[\\w]'
    },
    link: {
      oneOf: [{ type: 'string' }, { type: 'null' }]
    },
    notes: {
      oneOf: [{ type: 'string' }, { type: 'null' }]
    },
    ticket_slug: {
      oneOf: [{ type: 'string', pattern: '^[\\w-]+$' }, { type: 'null' }]
    },
    version: {
      oneOf: [{ type: 'string' }, { type: 'null' }]
    }
  },
  additionalProperties: false,
  required: [
    'recorded_at',
    'recorded_by',
    'environment',
    'change_type',
    'description'
  ]
}

export const propTypes = {
  id: PropTypes.number.isRequired,
  recorded_at: PropTypes.string.isRequired,
  recorded_by: PropTypes.string.isRequired,
  completed_at: PropTypes.string,
  project_id: PropTypes.number,
  environment: PropTypes.string.isRequired,
  change_type: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  link: PropTypes.string,
  notes: PropTypes.string,
  ticket_slug: PropTypes.string,
  version: PropTypes.string
}
