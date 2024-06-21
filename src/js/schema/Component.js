export const jsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    package_url: {
      type: 'string',
      pattern: 'pkg:[^/]+/.*'
    },
    name: { type: 'string' },
    status: {
      type: 'string',
      enum: ['Active', 'Deprecated', 'Forbidden']
    },
    home_page: {
      oneOf: [{ type: 'string', format: 'http-url' }, { type: 'null' }],
      default: null
    },
    icon_class: { type: 'string' },
    active_version: { oneOf: [{ type: 'string' }, { type: 'null' }] }
  },
  additionalProperties: true,
  required: [
    'active_version',
    'home_page',
    'icon_class',
    'name',
    'package_url',
    'status'
  ]
}
