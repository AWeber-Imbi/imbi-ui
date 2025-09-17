import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Icon } from '../../components'
import { Context } from '../../state'
import { User } from '../../schema'

function GitHubConnectButton({ user }) {
  const [globalState] = useContext(Context)
  const { t } = useTranslation()
  const path = location.pathname.split('?')[0]
  const state = btoa(`${user.username}:${path}`)
    .replace('+', '-')
    .replace('/', '_')

  function redirectToGitHub(e) {
    e.preventDefault()
    document.location =
      `${globalState.integrations.github.authorizationEndpoint}` +
      `?client_id=${globalState.integrations.github.clientId}` +
      `&redirect_uri=${globalState.integrations.github.redirectURI}` +
      `&state=${state}` +
      `&allow_signup=false`
  }

  return (
    <Button className="btn-blue" onClick={redirectToGitHub}>
      <Icon icon="fab github" className="mr-2" /> {t('project.github.connect')}
    </Button>
  )
}
GitHubConnectButton.propTypes = {
  user: PropTypes.exact(User)
}
export { GitHubConnectButton }
