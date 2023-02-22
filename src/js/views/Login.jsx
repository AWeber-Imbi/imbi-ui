import PropTypes from 'prop-types'
import React, { useContext, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, Button } from '../components'
import { Context } from '../state'
import { httpPost, setDocumentTitle } from '../utils'
import { Link } from 'react-router-dom'

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
            {(useLocalUsers || useLDAP) && (
              <form className="space-y-6" action="#" onSubmit={onSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                  {state.errorMessage !== null && (
                    <div className="pb-4">
                      <Alert level="error">{state.errorMessage}</Alert>
                    </div>
                  )}
                  <div className="mb-4">
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="block text-sm font-medium text-gray-700 mb-1">
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
              <>
                {(useLDAP || useLocalUsers) && (
                  <div className="h-[1px] bg-gray-200"></div>
                )}
                <div className="flex justify-center">
                  <Link reloadDocument to="/ui/login/google">
                    <Button>
                      <div className="flex items-center gap-2">
                        <svg
                          height="24px"
                          xmlns="http://www.w3.org/2000/svg"
                          xmlnsXlink="http://www.w3.org/1999/xlink"
                          viewBox="0 0 48 48">
                          <defs>
                            <path
                              id="a"
                              d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"
                            />
                          </defs>
                          <clipPath id="b">
                            <use xlinkHref="#a" overflow="visible" />
                          </clipPath>
                          <path
                            clipPath="url(#b)"
                            fill="#FBBC05"
                            d="M0 37V11l17 13z"
                          />
                          <path
                            clipPath="url(#b)"
                            fill="#EA4335"
                            d="M0 11l17 13 7-6.1L48 14V0H0z"
                          />
                          <path
                            clipPath="url(#b)"
                            fill="#34A853"
                            d="M0 37l30-23 7.9 1L48 0v48H0z"
                          />
                          <path
                            clipPath="url(#b)"
                            fill="#4285F4"
                            d="M48 48L17 24l-4-3 35-10z"
                          />
                        </svg>
                        {t('login.signInWithGoogle')}
                      </div>
                    </Button>
                  </Link>
                </div>
              </>
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
