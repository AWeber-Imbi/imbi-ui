import { DateTime } from 'luxon'
import Gravatar from 'react-gravatar'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Context } from '../../../state'
import { lookupNamespaceByID } from '../../../utils'

function ActivityEntry({ entry }) {
  const { t, i18n } = useTranslation()
  const [globalState] = useContext(Context)

  let action = t('dashboard.activityFeed.created')
  if (entry.what === 'updated') action = t('dashboard.activityFeed.updated')
  if (entry.what === 'updated facts')
    action = t('dashboard.activityFeed.updatedFacts')
  const when = DateTime.fromISO(entry.when)
  const namespace = entry.namespace
  const project = entry.project_name
  const displayName = entry.display_name
  const filter = encodeURIComponent(
    `namespace_slug:${
      lookupNamespaceByID(globalState.metadata.namespaces, entry.namespace_id)
        .slug
    }`
  )
  return (
    <li className="flex p-2 space-x-3">
      <Gravatar
        className="h-8 w-8 rounded-full"
        default="mp"
        email={entry.email_address}
        size={22}
      />
      <div className="min-w-0 flex-1 text-sm text-gray-700">
        <Trans i18nKey={'dashboard.activityFeed.entry'} i18n={i18n} t={t}>
          <span className="font-medium text-gray-700">{{ displayName }}</span>
          <span>{{ action }}</span>
          <Link
            to={`/ui/projects/${entry.project_id}`}
            className="font-medium text-blue-700 hover:text-blue-800">
            {{ project }}
          </Link>
          <Link
            to={`/ui/projects?f=${filter}`}
            className="font-medium text-blue-700 hover:text-blue-800">
            {{ namespace }}
          </Link>
        </Trans>
        <p
          className="mt-0.5 text-sm text-gray-500"
          title={when.toLocaleString(DateTime.DATETIME_MED)}>
          {when.toRelative()}
        </p>
      </div>
    </li>
  )
}
ActivityEntry.propTypes = {
  entry: PropTypes.shape({
    display_name: PropTypes.string,
    email_address: PropTypes.string,
    namespace: PropTypes.string,
    namespace_id: PropTypes.number,
    project_id: PropTypes.number,
    project_name: PropTypes.string,
    project_type: PropTypes.string,
    what: PropTypes.string,
    when: PropTypes.string,
    who: PropTypes.string
  })
}
export { ActivityEntry }
