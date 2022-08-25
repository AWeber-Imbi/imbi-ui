import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { byString } from 'sort-es'

import { Modal } from '../../components'
import { Context } from '../../state'

function HelpDialog({ onClose }) {
  const { t } = useTranslation()
  const [globalState] = useContext(Context)
  const fields = Array.from(
    new Set(globalState.openSearch.fields.map((field) => field.name))
  )
  return (
    <Modal onClose={onClose}>
      <Modal.Title>{t('projects.searchHelpTitle')}</Modal.Title>
      <div>
        <span
          dangerouslySetInnerHTML={{
            __html: t('projects.searchHelpDQL', {
              interpolation: { escapeValue: false }
            })
          }}
        />
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
  onClose: PropTypes.func
}
export { HelpDialog }
