import PropTypes from 'prop-types'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { GitlabConnectButton, Modal } from '../../../components'
import { User } from '../../../schema'

function GitlabConnectModal({ onClose, user }) {
  const { t } = useTranslation()

  return (
    <Modal onClose={onClose}>
      <Modal.Title icon="fab gitlab">{t('project.gitlab.connect')}</Modal.Title>
      <Modal.Body>{t('project.gitlab.notConnected')}</Modal.Body>
      <Modal.Footer closeText={t('common.cancel')} onClose={onClose}>
        <GitlabConnectButton user={user} />
      </Modal.Footer>
    </Modal>
  )
}

GitlabConnectModal.propTypes = {
  onClose: PropTypes.func,
  user: PropTypes.exact(User)
}
export { GitlabConnectModal }
