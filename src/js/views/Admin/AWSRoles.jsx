import React, { useContext } from 'react'

import { CRUD } from '../../components'
import { useTranslation } from 'react-i18next'
import { jsonSchema } from '../../schema/AWSRoles'
import { metadataAsOptions } from '../../settings'
import { Context } from '../../state'

export function AWSRoles() {
  const [globalState] = useContext(Context)
  const { t } = useTranslation()

  const namespaceById = Object.fromEntries(
    globalState.metadata.namespaces.map((namespace) => [
      namespace.id,
      namespace
    ])
  )

  return (
    <CRUD
      collectionIcon="fas key"
      collectionName={t('admin.aws_roles.collectionName')}
      collectionPath="/aws-roles"
      columns={[
        {
          title: t('id'),
          name: 'id',
          type: 'hidden',
          omitOnAdd: true,
          tableOptions: {
            hide: true
          }
        },
        {
          title: t('common.name'),
          name: 'role_arn',
          type: 'text',
          tableOptions: {
            className: 'truncate',
            headerClassName: 'w-6/12'
          }
        },
        {
          title: t('terms.environment'),
          name: 'environment',
          type: 'select',
          options: metadataAsOptions(globalState.metadata.environments, 'name'),
          tableOptions: {
            className: 'truncate',
            headerClassName: 'w-3/12'
          }
        },
        {
          title: t('terms.namespace'),
          name: 'namespace_id',
          type: 'select',
          castTo: 'number',
          options: metadataAsOptions(globalState.metadata.namespaces),
          tableOptions: {
            className: 'truncate',
            headerClassName: 'w-3/12',
            lookupFunction: (namespaceId) => namespaceById[namespaceId].slug
          }
        }
      ]}
      errorStrings={{
        'Unique Violation': t('admin.aws_roles.errors.uniqueViolation')
      }}
      itemIgnore={['created_by', 'created_at']}
      itemKey="id"
      itemName={t('admin.aws_roles.itemName')}
      itemPath="/aws-roles/{{value}}"
      itemTitle="role_arn"
      jsonSchema={jsonSchema}
    />
  )
}
