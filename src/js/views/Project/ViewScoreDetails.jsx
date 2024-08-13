import React, { Fragment, useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { DescriptionList } from '../../components/DescriptionList/DescriptionList'
import { Definition } from '../../components/DescriptionList/Definition'
import { httpGet } from '../../utils'
import { Context } from '../../state'
import { Alert, Icon, Loading } from '../../components'
import { useTranslation } from 'react-i18next'

function scoreClass(score, selected) {
  return selected
    ? 'font-medium ' +
        (score > 89
          ? 'bg-green-200'
          : score > 69
          ? 'bg-yellow-200'
          : 'bg-red-200')
    : 'font-light'
}

const FactHeading = ({ value, totalWeight }) => {
  const valueClassName =
    value.value === null ||
    (value.data_type === 'boolean' && value.value !== true)
      ? 'bg-red-200'
      : value.data_type === 'boolean' && value.value === true
      ? 'bg-green-200'
      : ''
  return (
    <div className="grid grid-cols-2 text-sm ml-2">
      <div className="font-medium">Weight</div>
      <div>
        {value.weight} / {totalWeight}
      </div>
      <div className={`${valueClassName} font-medium`}>Value</div>
      <div className={valueClassName}>
        <FactValue value={value} />
      </div>
      <div className="font-medium">Score</div>
      <div>{value.score}</div>
    </div>
  )
}

const EnumValues = ({ enums }) => {
  return (
    <div className="grid grid-cols-2 text-sm mt-2 ml-2">
      {enums.map(({ score, selected, value }) => (
        <Fragment key={value}>
          <div className={scoreClass(score, selected)}>{value}</div>
          <div className={scoreClass(score, selected)}>{score}</div>
        </Fragment>
      ))}
    </div>
  )
}

const RangeValues = ({ ranges }) => {
  return (
    <div className="grid grid-cols-2 text-sm mt-2 ml-2">
      {ranges.map(({ value, score, selected }) => (
        <Fragment key={`${value[0]}-${value[1]}`}>
          <div className={scoreClass(score, selected)}>
            {value[0]}-{value[1]}
          </div>
          <div className={scoreClass(score, selected)}>{score}</div>
        </Fragment>
      ))}
    </div>
  )
}

const FactValue = ({ value }) => {
  const { t } = useTranslation()
  if (value.value === null || value.value === undefined) {
    return <div>{t('common.notSet')}</div>
  }
  if (value.data_type === 'boolean') {
    if (value.value === true) {
      return <Icon className="text-green-600" icon="fas check" />
    }
    return <Icon className="text-red-600" icon="fas times-circle" />
  }
  return <div>{value.value}</div>
}

const FactDescription = ({ value, totalWeight }) => {
  switch (value.fact_type) {
    case 'enum':
      return (
        <Definition term={value.name}>
          <FactHeading value={value} totalWeight={totalWeight} />
          <EnumValues enums={value.enums} />
        </Definition>
      )
    case 'range':
      return (
        <Definition term={value.name}>
          <FactHeading value={value} totalWeight={totalWeight} />
          <RangeValues ranges={value.ranges} />
        </Definition>
      )
    default:
      return (
        <Definition term={value.name}>
          <FactHeading value={value} totalWeight={totalWeight} />
        </Definition>
      )
  }
}

export function ViewScoreDetails({ project }) {
  const [globalState] = useContext(Context)
  const [fetching, setFetching] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [facts, setFacts] = useState([])
  const [totalWeight, setTotalWeight] = useState(0)
  useEffect(() => {
    setFetching(true)
    setFacts([])
    setTotalWeight(0)
    httpGet(
      globalState.fetch,
      new URL(`/projects/${project.id}/score-detail`, globalState.baseURL),
      ({ data }) => {
        setFacts(data.scored_facts)
        setTotalWeight(data.scored_facts.reduce((acc, f) => acc + f.weight, 0))
        setFetching(false)
      },
      ({ message }) => {
        setErrorMessage(message)
        setFetching(false)
      }
    )
  }, [])

  if (fetching) return <Loading />
  if (errorMessage) return <Alert level="error">{errorMessage}</Alert>
  return (
    <DescriptionList>
      {facts.map((fact) => (
        <FactDescription
          key={fact.name}
          value={fact}
          totalWeight={totalWeight}
        />
      ))}
    </DescriptionList>
  )
}
ViewScoreDetails.propTypes = {
  project: PropTypes.object.isRequired
}
