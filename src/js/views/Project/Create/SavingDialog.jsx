import PropTypes from 'prop-types'
import React from 'react'

import { SavingModal } from '../../../components'

class SavingDialog extends React.PureComponent {
  constructor(props) {
    super(props)
    this.generateSteps.bind(this)
  }

  generateSteps() {
    const steps = [
      {
        isComplete: this.props.complete.attributes,
        pendingLabel: this.props.translate('project.savingProject'),
        completedLabel: this.props.translate('project.projectSaved')
      }
    ]
    if (this.props.options.urls)
      steps.push({
        isComplete: this.props.complete.urls,
        pendingLabel: this.props.translate('project.savingURLs'),
        completedLabel: this.props.translate('project.urlsSaved')
      })

    if (this.props.options.links)
      steps.push({
        isComplete: this.props.complete.links,
        pendingLabel: this.props.translate('project.savingLinks'),
        completedLabel: this.props.translate('project.linksSaved')
      })

    if (this.props.options.gitlab)
      steps.push({
        isComplete: this.props.complete.gitlab,
        pendingLabel: this.props.translate('project.gitlab.creatingRepo'),
        completedLabel: this.props.translate('project.gitlab.repoCreated')
      })

    if (this.props.options.sonarqube)
      steps.push({
        isComplete: this.props.complete.sonarqube,
        pendingLabel: this.props.translate('project.sonarqube.creatingProject'),
        completedLabel: this.props.translate('project.sonarqube.projectCreated')
      })

    if (this.props.options.sentry)
      steps.push({
        isComplete: this.props.complete.sentry,
        pendingLabel: this.props.translate('project.sentry.creatingProject'),
        completedLabel: this.props.translate('project.sentry.projectCreated')
      })

    if (this.props.options.projectCookieCutter)
      steps.push({
        isComplete: this.props.complete.projectCookieCutter,
        pendingLabel: this.props.translate(
          'project.gitlab.creatingInitialCommit'
        ),
        completedLabel: this.props.translate(
          'project.gitlab.initialCommitCreated'
        )
      })

    if (this.props.options.grafanaCookieCutter)
      steps.push({
        isComplete: this.props.complete.projectCookieCutter,
        pendingLabel: this.props.translate('project.creatingGrafanaDashboard'),
        completedLabel: this.props.translate('project.grafanaDashboardCreated')
      })

    return steps
  }

  render() {
    const steps = this.generateSteps()
    return (
      <SavingModal
        title={
          this.props.saving
            ? this.props.translate('project.savingProject')
            : this.props.translate('project.projectSaved')
        }
        steps={steps}
        onSaveComplete={this.props.onSaveComplete}
      />
    )
  }
}
SavingDialog.defaultProps = {
  complete: {
    attributes: false,
    gitlab: false,
    grafanaCookieCutter: false,
    links: false,
    projectCookieCutter: false,
    sentry: false,
    sonarqube: false,
    urls: false
  },
  options: {
    gitlab: false,
    grafanaCookieCutter: false,
    links: false,
    projectCookieCutter: false,
    sentry: false,
    sonarqube: false,
    urls: false
  }
}
SavingDialog.propTypes = {
  complete: PropTypes.shape({
    attributes: PropTypes.bool,
    gitlab: PropTypes.bool,
    grafanaCookieCutter: PropTypes.bool,
    links: PropTypes.bool,
    onSaveComplete: PropTypes.func,
    projectCookieCutter: PropTypes.bool,
    sentry: PropTypes.bool,
    sonarqube: PropTypes.bool,
    translate: PropTypes.func,
    urls: PropTypes.bool
  }),
  options: PropTypes.shape({
    gitlab: PropTypes.bool,
    grafanaCookieCutter: PropTypes.bool,
    links: PropTypes.bool,
    onSaveComplete: PropTypes.func,
    projectCookieCutter: PropTypes.bool,
    sentry: PropTypes.bool,
    sonarqube: PropTypes.bool,
    translate: PropTypes.func,
    urls: PropTypes.bool
  }),
  onSaveComplete: PropTypes.func,
  saving: PropTypes.bool,
  translate: PropTypes.func
}
export { SavingDialog }
