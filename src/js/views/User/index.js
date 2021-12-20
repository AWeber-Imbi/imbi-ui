import PropTypes from 'prop-types'
import React from 'react'
import { Route, Routes } from 'react-router-dom'

import { Profile } from './Profile'
import { Settings } from './Settings'
import { User as Schema } from '../../schema'

function User({ user }) {
  return (
    <Routes>
      <Route path="/ui/user/profile">
        <Profile user={user} />
      </Route>
      <Route path="/ui/user/settings">
        <Settings />
      </Route>
    </Routes>
  )
}
User.propTypes = {
  user: PropTypes.exact(Schema)
}

export { User }
