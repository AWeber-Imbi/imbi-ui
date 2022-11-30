import React from 'react'
import PropTypes from 'prop-types'
import { Trans, useTranslation } from 'react-i18next'

function ProjectUpdatedEntry({ recordedBy }) {
  const { t, i18n } = useTranslation()

  return (
    <Trans i18nKey="project.feed.updated" i18n={i18n} t={t}>
      <span className="font-medium text-gray-900 whitespace-nowrap">
        {{ recordedBy }}
      </span>
    </Trans>
  )
}
ProjectUpdatedEntry.propTypes = {
  recordedBy: PropTypes.string.isRequired
}
export { ProjectUpdatedEntry }
