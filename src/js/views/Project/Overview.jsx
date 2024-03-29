import PropTypes from 'prop-types'
import React, { Fragment, useContext, useEffect, useRef, useState } from 'react'

import { Details } from './Details'
import { Facts } from './Facts'
import { Context } from '../../state'
import { ProjectFeed } from './ProjectFeed/ProjectFeed'

function Overview({ factTypes, project, refresh, urlPath }) {
  const [state, dispatch] = useContext(Context)
  const [height, setHeight] = useState()
  const projectInfoDiv = useRef()
  useEffect(() => {
    dispatch({
      type: 'SET_CURRENT_PAGE',
      payload: {
        url: new URL(urlPath, state.baseURL),
        title: project.name
      }
    })

    const infoHeight = projectInfoDiv.current.clientHeight
    setHeight(`${infoHeight}px`)
  }, [])
  const [editing, setEditing] = useState({ details: false, facts: false })

  return (
    <Fragment>
      <div
        className={`flex flex-col lg:flex-row space-x-0 lg:space-x-3 space-y-3 lg:space-y-0 text-left text-gray-600 ${
          editing.details === false && editing.facts === false
            ? 'lg:items-stretch'
            : ''
        }`}>
        <div
          ref={projectInfoDiv}
          className={`flex-auto ${
            factTypes.length > 0 ? 'lg:w-6/12' : ''
          } w-full ${
            editing.details === false && editing.facts === false
              ? 'lg:flex-grow'
              : ''
          }`}>
          <Details
            project={project}
            editing={editing.details}
            refresh={refresh}
            onEditing={(isEditing) =>
              setEditing({ ...editing, details: isEditing })
            }
            shouldGrow={editing.details === false && editing.facts === false}
          />
        </div>
        {factTypes.length > 0 && (
          <div
            className={`flex-auto lg:w-6/12 w-full ${
              editing.details === false && editing.facts === false
                ? 'lg:flex-grow'
                : ''
            }`}>
            <Facts
              project={project}
              factTypes={factTypes}
              editing={editing.facts}
              refresh={refresh}
              onEditing={(isEditing) =>
                setEditing({ ...editing, facts: isEditing })
              }
              shouldGrow={editing.details === false && editing.facts === false}
            />
          </div>
        )}
        <div
          className="flex-auto lg:w-6/12 w-full"
          style={height ? { height: height } : null}>
          <ProjectFeed projectID={project.id} />
        </div>
      </div>
    </Fragment>
  )
}
Overview.propTypes = {
  factTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
  project: PropTypes.object.isRequired,
  refresh: PropTypes.func.isRequired,
  urlPath: PropTypes.string.isRequired
}
export { Overview }
