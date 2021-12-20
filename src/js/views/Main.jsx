import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import { Admin, NotFound, User } from '.'
import { Breadcrumbs, ErrorBoundary, Loading } from '../components'
import { ComponentPreviews } from '../components/Components'
import { Context } from '../state'
import { Dashboard } from './Dashboard/Dashboard'
import { NewEntry, OperationsLog } from './OperationsLog/'
import { Project } from './Project/'
import { Projects } from './Projects/'
import { Reports } from './Reports/Reports'
import { useSettings } from '../settings'
import { User as UserSchema } from '../schema'

function Main({ user }) {
  const [globalState] = useContext(Context)
  const [state, setState] = useState({
    content: <Loading />
  })

  useSettings()

  useEffect(() => {
    if (
      globalState.integrations !== undefined &&
      globalState.metadata !== undefined &&
      globalState.openSearch !== undefined
    )
      setState({
        ...state,
        content: (
          <ErrorBoundary>
            <Breadcrumbs />
            <main className="flex-grow flex flex-row z-10">
              <Routes>
                {user.permissions.includes('admin') && (
                  <Route path="/ui/admin/*" element={<Admin user={user} />} />
                )}
                <Route path="/ui/components" element={<ComponentPreviews />} />
                <Route
                  path="/ui/operations-log/create"
                  element={<NewEntry user={user} />}
                />
                <Route
                  path="/ui/operations-log"
                  element={<OperationsLog user={user} />}
                />
                <Route
                  path="/ui/projects/create"
                  element={<Project.Create user={user} />}
                />
                <Route
                  path="/ui/projects/import"
                  element={<Project.GitlabImport user={user} />}
                />
                <Route
                  path="/ui/projects/:projectId"
                  element={<Project.Detail user={user} />}
                />
                <Route path="/ui/projects" element={<Projects user={user} />} />
                <Route path="/ui/reports" element={<Reports user={user} />} />
                <Route path="/ui/user" element={<User user={user} />} />
                <Route path="/ui/" element={<Dashboard user={user} />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </ErrorBoundary>
        )
      })
  }, [globalState.integrations, globalState.metadata, globalState.openSearch])

  return state.content
}
Main.propTypes = {
  user: PropTypes.exact(UserSchema)
}
export { Main }
