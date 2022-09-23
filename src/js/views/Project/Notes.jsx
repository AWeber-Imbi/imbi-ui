import PropTypes from 'prop-types'
import React, { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Context } from '../../state'
import { CRUD } from '../../components'
import { jsonSchema } from '../../schema/ProjectNotes'

function Notes({ project, urlPath }) {
  const [state, dispatch] = useContext(Context)
  const { t } = useTranslation()

  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        title: 'common.notes',
        url: new URL(`${urlPath}/notes`, state.baseURL)
      }
    })
  }, [])

  const collectionPath = `/projects/${project.id}/notes`

  return (
    <CRUD
      itemKey="id"
      itemName={t('terms.projectNote')}
      itemPath={`${collectionPath}/{{value}}`}
      itemTitle={(params) => params.id || t('project.notes.new')}
      collectionName={t('terms.projectNotes')}
      collectionPath={collectionPath}
      jsonSchema={jsonSchema}
      errorStrings={{}}
      columns={[
        {
          title: t('id'),
          name: 'id',
          type: 'hidden',
          readOnly: true,
          omitOnAdd: true,
          tableOptions: {
            className: 'text-center',
            headerClassName: 'text-center w-1/12'
          }
        },
        {
          title: t('project.notes.content'),
          name: 'content',
          type: 'textarea',
          tableOptions: { className: 'truncate' }
        },
        {
          title: t('common.createdBy'),
          name: 'created_by',
          type: 'text',
          readOnly: true,
          omitOnAdd: true,
          tableOptions: { headerClassName: 'w-2/12' }
        },
        {
          title: t('common.updatedBy'),
          name: 'updated_by',
          type: 'text',
          readOnly: true,
          omitOnAdd: true,
          tableOptions: { headerClassName: 'w-2/12' }
        },
        {
          title: t('project.id'),
          name: 'project_id',
          type: 'hidden',
          omitOnAdd: true,
          tableOptions: { hide: true }
        }
      ]}
    />
  )
}
Notes.propTypes = {
  project: PropTypes.object.isRequired,
  urlPath: PropTypes.string.isRequired
}
export { Notes }
