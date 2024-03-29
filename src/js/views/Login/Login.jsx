import PropTypes from 'prop-types'
import React, { useContext, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '../../components'
import { Context } from '../../state'
import { httpPost, setDocumentTitle } from '../../utils'
import { Google } from './Google'
import Logo from '../../../images/logo.svg'

function Login({ onLoginCallback, useLDAP, useLocalUsers, useGoogle }) {
  const [globalState] = useContext(Context)
  const [state, setState] = useState({
    credentials: {
      username: null,
      password: null
    },
    errorMessage: null,
    submitting: false
  })
  const { t } = useTranslation()
  const usernameRef = useRef()

  setDocumentTitle(t('login.signIn'))

  function onChange(e) {
    const { name, value } = e.target
    setState({ ...state, credentials: { ...state.credentials, [name]: value } })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setState({ ...state, submitting: true, errorMessage: null })
    const response = await httpPost(
      globalState.fetch,
      new URL('/ui/login', globalState.baseURL),
      {
        username: state.credentials.username,
        password: state.credentials.password
      },
      { credentials: 'include' }
    )
    if (response.success === true) {
      onLoginCallback(response.data)
    } else {
      setState({
        ...state,
        errorMessage: response.data,
        submitting: false,
        credentials: { ...state.credentials, password: null }
      })
      usernameRef.current.focus()
    }
  }

  return (
    <main className="flex flex-row flex-grow overflow-y-auto">
      <div className="container mx-auto my-auto">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 space-y-8 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center mb-4 gap-2">
              <img
                src={Logo}
                style={{ height: '56px', width: '56px' }}
                alt=""
              />
              <h1 className="text-xl text-gray-700">{t('login.title')}</h1>
            </div>
            {(useLocalUsers || useLDAP) && (
              <form className="space-y-6" action=".#" onSubmit={onSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                  {state.errorMessage !== null && (
                    <div className="pb-4">
                      <Alert level="error">{state.errorMessage}</Alert>
                    </div>
                  )}
                  <div className="mb-4">
                    <label
                      htmlFor="username"
                      className="block text-sm font-semibold text-gray-500 mb-1">
                      {(useLDAP ? 'LDAP ' : '') + t('login.username')}
                    </label>
                    <input
                      id="username"
                      autoComplete="username"
                      className={
                        state.errorMessage !== null
                          ? 'form-input-error'
                          : 'form-input'
                      }
                      autoFocus
                      name="username"
                      onChange={onChange}
                      ref={usernameRef}
                      required
                      type="text"
                      value={
                        state.credentials.username !== null
                          ? state.credentials.username
                          : ''
                      }
                    />
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-500 mb-1">
                      {t('login.password')}
                    </label>
                    <input
                      id="password"
                      autoComplete="current-password"
                      className={
                        state.errorMessage !== null
                          ? 'form-input-error'
                          : 'form-input'
                      }
                      name="password"
                      onChange={onChange}
                      required
                      type="password"
                      value={
                        state.credentials.password !== null
                          ? state.credentials.password
                          : ''
                      }
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="btn-blue w-full"
                      disabled={
                        state.submitting ||
                        state.credentials.username === null ||
                        state.credentials.password === null
                      }>
                      {t('login.signIn')}
                    </button>
                  </div>
                </div>
              </form>
            )}
            {useGoogle && (
              <div className="flex flex-col items-center gap-4">
                {((useLDAP || useLocalUsers) && (
                  <div className="h-[1px] bg-gray-200 w-full mb-4"></div>
                )) || (
                  <p className="text-sm font-medium text-gray-500">
                    {t('login.googleRequired')}
                  </p>
                )}
                <Google />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
Login.propTypes = {
  onLoginCallback: PropTypes.func,
  useLDAP: PropTypes.bool,
  useLocalUsers: PropTypes.bool,
  useGoogle: PropTypes.bool
}
export { Login }
