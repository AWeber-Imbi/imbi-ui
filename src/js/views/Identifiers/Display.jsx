import React from 'react'
import PropTypes from 'prop-types'
import { DateTime } from 'luxon'
import { Definition } from '../../components/DescriptionList/Definition'
import { DescriptionList } from '../../components/DescriptionList/DescriptionList'
import { useTranslation } from 'react-i18next'

function Display({ entry }) {
  const { t } = useTranslation()
  return (
    <DescriptionList>
      <Definition term={t('project.identifiers.integrationName')}>
        {entry.integration_name}
      </Definition>
      <Definition term={t('project.identifiers.externalId')}>
        {entry.external_id}
      </Definition>
      <Definition term={t('common.createdAt')}>
        {DateTime.fromISO(entry.created_at).toLocaleString(
          DateTime.DATETIME_MED
        )}
      </Definition>
      <Definition term={t('common.createdBy')}>{entry.created_by}</Definition>
      <Definition term={t('common.lastUpdatedTitle')}>
        {entry.last_modified_at === null
          ? ''
          : DateTime.fromISO(entry.last_modified_at).toLocaleString(
              DateTime.DATETIME_MED
            )}
      </Definition>
      <Definition term={t('common.lastUpdatedBy')}>
        {entry.last_modified_by === null ? '' : entry.last_modified_by}
      </Definition>
    </DescriptionList>
  )
}

Display.propTypes = {
  entry: PropTypes.object.isRequired
}
export { Display }
