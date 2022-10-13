import PropTypes from 'prop-types'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { byString } from 'sort-es'

import { Modal } from '../../components'

function HelpDialog({ title, searchHelp, fields, onClose }) {
  const { t } = useTranslation()
  return (
    <Modal onClose={onClose}>
      <Modal.Title>{title}</Modal.Title>
      <div>
        <span>
          {searchHelp}
          <a
            href="https://opensearch.org/docs/latest/dashboards/dql"
            className="text-blue-600 underline"
            target="_new">
            {t('opensearch.dql')}
          </a>
        </span>
        <h1 className="my-4 font-bold">{t('projects.searchHelpFields')}</h1>
        <ul className="list-disc list-inside max-h-36 ml-5 font-mono overflow-scroll">
          {fields.sort(byString()).map((field) => {
            return <li key={`field-` + field}>{field}</li>
          })}
        </ul>
      </div>
      <Modal.Footer closeText="Close" onClose={onClose} />
    </Modal>
  )
}

HelpDialog.propTypes = {
  title: PropTypes.string.isRequired,
  searchHelp: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(PropTypes.string),
  onClose: PropTypes.func
}
export { HelpDialog }
