import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Icon } from '../../components'
import { Context } from '../../state'
import { User } from '../../schema'

function GitlabConnectButton({ user }) {
  const [globalState] = useContext(Context)
  const { t } = useTranslation()
  const path = location.pathname.split('?')[0]
  const state = btoa(`${user.username}:${path}`)
    .replace('+', '-')
    .replace('/', '_')

  function redirectToGitlab(e) {
    e.preventDefault()
    document.location =
      `${globalState.integrations.gitlab.authorizationEndpoint}` +
      `?client_id=${globalState.integrations.gitlab.clientId}` +
      `&redirect_uri=${globalState.integrations.gitlab.redirectURI}` +
      `&response_type=code` +
      `&state=${state}` +
      `&scope=api`
  }

  return (
    <Button className="btn-blue" onClick={redirectToGitlab}>
      <Icon icon="fab gitlab" className="mr-2" /> {t('project.gitlab.connect')}
    </Button>
  )
}
GitlabConnectButton.propTypes = {
  user: PropTypes.exact(User)
}
export { GitlabConnectButton }
