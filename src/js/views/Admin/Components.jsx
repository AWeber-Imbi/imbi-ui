import React from 'react'

import { CRUD } from '../../components'
import { jsonSchema } from '../../schema/Component'
import { useTranslation } from 'react-i18next'
import { displayLabelValue } from '../../utils'

function Components() {
  const { t } = useTranslation()
  const statusOptions = [
    { label: t('admin.components.statusValues.active'), value: 'Active' },
    {
      label: t('admin.components.statusValues.deprecated'),
      value: 'Deprecated'
    },
    { label: t('admin.components.statusValues.forbidden'), value: 'Forbidden' }
  ]

  return (
    <CRUD
      collectionIcon="fas cog"
      collectionName={t('admin.components.collectionName')}
      collectionPath={'/components'}
      itemKey={'package_url'}
      itemIgnore={[
        'created_at',
        'created_by',
        'last_modified_at',
        'last_modified_by',
        'link',
        'project_count',
        'version_count'
      ]}
      itemName={t('admin.components.itemName')}
      itemPath={'/components/{{value}}'}
      jsonSchema={jsonSchema}
      errorStrings={{}}
      columns={[
        {
          title: t('common.icon'),
          name: 'icon_class',
          type: 'icon',
          default: 'fas save',
          placeholder: 'fas save',
          tableOptions: {
            className: 'text-center',
            headerClassName: 'w-1/12'
          }
        },
        {
          title: t('common.name'),
          name: 'name',
          type: 'text',
          tableOptions: {
            className: 'truncate',
            headerClassName: 'w-2/12'
          }
        },
        {
          title: t('admin.components.packageURL'),
          name: 'package_url',
          type: 'text',
          tableOptions: {
            className: 'truncate',
            headerClassName: 'w-2/12'
          }
        },
        {
          title: t('admin.components.status'),
          name: 'status',
          type: 'select',
          options: statusOptions,
          tableOptions: {
            lookupFunction: (value) => {
              return displayLabelValue(value, statusOptions)
            }
          }
        },
        {
          title: t('admin.components.homePage'),
          name: 'home_page',
          type: 'text',
          saveOptions: {
            emptyIsNull: true
          },
          tableOptions: {
            hide: true
          }
        },
        {
          title: t('admin.components.activeVersion'),
          name: 'active_version',
          type: 'text',
          saveOptions: { emptyIsNull: true }
        },
        {
          title: 'Used in',
          name: 'project_count',
          type: 'number',
          omitOnAdd: true,
          readOnly: true,
          tableOptions: { headerClassName: 'w-1/12' }
        },
        {
          title: 'Versions',
          name: 'version_count',
          type: 'number',
          omitOnAdd: true,
          readOnly: true,
          tableOptions: { headerClassName: 'w-1/12' }
        }
      ]}
    />
  )
}

export { Components }
