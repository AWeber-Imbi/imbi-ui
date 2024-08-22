export default {
  en: {
    translation: {
      aws: {
        ssmParameter: 'SSM Parameter'
      },
      common: {
        all: 'All',
        cancel: 'Cancel',
        close: 'Close',
        configuration: 'Configuration',
        createdAt: 'Created At',
        createdBy: 'Created By',
        definitions: 'Definitions',
        description: 'Description',
        delete: 'Delete',
        done: 'Done',
        edit: 'Edit',
        filter: 'Filter',
        group: 'Group',
        icon: 'Icon',
        iconClass: 'Icon Class',
        id: 'ID',
        import: 'Import',
        importing: 'Importing',
        initializing: 'Initializing',
        invalidURL: 'Value does not appear to be a URL',
        lastUpdated: 'Last Updated: {{date}}',
        lastUpdatedBy: 'Last Updated By',
        lastUpdatedTitle: 'Last Updated',
        loading: 'Loading',
        logs: 'Logs',
        name: 'Name',
        notes: 'Notes',
        notSet: 'Not Set',
        off: 'Off',
        on: 'On',
        overview: 'Overview',
        refresh: 'Refresh',
        required: 'Required Field',
        save: 'Save',
        saving: 'Saving ...',
        search: 'Search',
        settings: 'Settings',
        slug: 'Slug',
        slugDescription:
          'A slug is the part of a URL which identifies a particular page on a website in an easy to read form.',
        textClass: 'Text Class',
        turnOff: 'Turn Off',
        turnOn: 'Turn On',
        type: 'Type',
        updatedBy: 'Updated By',
        value: 'Value',
        welcome: 'Welcome'
      },
      paginator: {
        next: 'Next',
        pageSize: 'Page Size',
        position:
          'Showing {{startRecord}} to {{endRecord}} of {{totalRecords}} {{noun}}',
        previous: 'Previous'
      },
      terms: {
        dataCenter: 'Data Center',
        deploymentType: 'Deployment Type',
        description: 'Description',
        environment: 'Environment',
        environments: 'Environments',
        healthScore: 'Health Score',
        links: 'Links',
        name: 'Name',
        namespace: 'Namespace',
        package: 'Package',
        project: 'Project',
        projects: 'Projects',
        projectInfo: 'Project Information',
        projectFacts: 'Project Facts',
        projectIdentifiers: 'Project Identifiers',
        projectNote: 'Note',
        projectNotes: 'Notes',
        projectType: 'Project Type',
        record: 'record',
        records: 'records',
        reports: 'Reports',
        score: 'Score',
        scoreHistory: 'Score History',
        stackHealthScore: 'Stack health Score',
        slug: 'Slug',
        version: 'Version'
      },
      error: {
        title: 'ERROR',
        accessDenied: 'Access Denied',
        notFound: 'Not Found'
      },
      headerNavItems: {
        administration: 'Administration',
        dashboard: 'Dashboard',
        importProject: 'Import from Gitlab',
        newOperationsLogEntry: 'Add Ops Log Entry',
        newProject: 'New Project',
        openNewMenu: 'Open New Menu',
        openUserMenu: 'Open User Menu',
        profile: 'Profile',
        settings: 'Settings',
        signOut: 'Sign Out',
        userMenu: 'User Menu'
      },
      footer: {
        apiDocumentation: 'API Documentation'
      },
      admin: {
        title: 'Administration',
        crud: {
          deleteConfirmation: {
            title: 'Delete {{itemName}}?',
            text: 'Are you sure you would like to delete "{{value}}" from the available {{collectionName}}?',
            button: 'Delete'
          },
          itemAdded:
            '"{{value}}" was successfully added to the available {{collectionName}}',
          itemDeleted:
            '"{{value}}" was successfully deleted from the available {{collectionName}}',
          itemUpdated:
            '"{{value}}" was successfully updated in the available {{collectionName}}',
          newTitle: 'New {{itemName}}',
          savingTitle: 'Saving {{itemName}}',
          updateTitle: 'Edit {{itemName}}'
        },
        sidebar: {
          settings: 'Settings',
          userManagement: 'User Management'
        },
        aws_roles: {
          collectionName: 'AWS Roles',
          itemName: 'AWS Role',
          errors: {
            uniqueViolation:
              'A role already exists for that environment and namespace'
          }
        },
        components: {
          activeVersion: 'Active Version',
          collectionName: 'Components',
          itemName: 'Component',
          homePage: 'Home Page',
          packageURL: 'Package URL',
          status: 'Status',
          statusValues: {
            active: 'Active',
            deprecated: 'Deprecated',
            forbidden: 'Forbidden'
          }
        },
        cookieCutters: {
          collectionName: 'Cookie Cutters',
          itemName: 'Cookie Cutter',
          type: 'Type',
          url: 'Git URL',
          urlDescription: 'The Git URL to the cookie cutter',
          errors: {
            uniqueViolation: 'A cookie cutter with the same name already exists'
          }
        },
        environments: {
          collectionName: 'Environments',
          itemName: 'Environment',
          errors: {
            uniqueViolation: 'An environment with the same name already exists'
          }
        },
        manageGroups: 'Manage Groups',
        manageUsers: 'Manage Users',
        namespaces: {
          collectionName: 'Namespaces',
          itemName: 'Namespace',
          maintainedBy: {
            title: 'Managed By',
            description:
              'Groups that have access to manage projects in this namespace'
          },
          errors: {
            uniqueViolation: 'A namespace with the same name already exists'
          },
          gitLabGroupName: {
            title: 'GitLab Group Path',
            description:
              'GitLab group slug/path that new projects for this namespace will be created in'
          },
          pagerDutyPolicy: {
            title: 'PagerDuty Escalation',
            description: 'PagerDuty escalation policy for this namespace'
          },
          sentryTeamSlug: {
            title: 'Sentry Team Slug',
            description:
              'Sentry team that new projects for this namespace will be created in'
          },
          awsSsmSlug: {
            title: 'AWS SSM Slug',
            description:
              'Namespace slug as it appears in the AWS SSM path prefix'
          }
        },
        projectFactTypes: {
          collectionName: 'Project Fact Types',
          itemName: 'Project Fact Type',
          projectType: 'Project Type',
          factType: 'Fact Type',
          dataType: 'Data Type',
          weight: 'Weight',
          weightDescription:
            'The weight from 0 to 100 against the total score for a project. Total weight should across all types for a project type should not exceed 100.',
          uiOptions: 'Display Options',
          errors: {
            uniqueViolation:
              'A project fact type with the same name already exists'
          }
        },
        projectFactTypeEnums: {
          collectionName: 'Fact Type Enums',
          itemName: 'Fact Type Enum Value',
          scoreDescription:
            'The score for this value, with a maximum value of 100'
        },
        projectFactTypeRanges: {
          collectionName: 'Fact Type Ranges',
          itemName: 'Fact Type Range',
          minValue: 'Minimum Value',
          maxValue: 'Maximum Value',
          scoreDescription:
            'The score for this value, with a maximum value of 100'
        },
        projectLinkTypes: {
          linkType: 'Link Type',
          collectionName: 'Project Link Types',
          itemName: 'Project Link Type',
          isPrimaryRepository: 'Primary Repository',
          createdByAutomation: 'Created by Automation',
          errors: {
            uniqueViolation:
              'A project link type with the same name already exists'
          }
        },
        projectTypes: {
          collectionName: 'Project Types',
          itemName: 'Project Type',
          pluralName: 'Pluralized Name',
          environmentURLs: 'Per-Environment URLs',
          gitLabProjectPrefix: {
            title: 'GitLab Project Prefix',
            description:
              'Prefix to use when creating GitLab projects of this type'
          },
          errors: {
            uniqueViolation: 'A project type with the same name already exists'
          }
        }
      },
      login: {
        username: 'User Name',
        password: 'Password',
        signIn: 'Sign in',
        title: 'Imbi Sign In',
        signInWithGoogle: 'Sign in with Google',
        googleRequired: 'Imbi requires signing in with Google.'
      },
      dashboard: {
        title: 'Dashboard',
        activityFeed: {
          recentActivity: 'Recent Activity',
          entry:
            '<0>{{displayName}}</0> <1>{{action}}</1> the <2>{{project}}</2> project in the <3>{{namespace}}</3> namespace.',
          opsLog:
            '<0>{{displayName}}</0> <2>{{changeType}}</2> in the <4>{{environment}}</4> environment.',
          opsLogVersion:
            '<0>{{displayName}}</0> <2>{{changeType}}</2> in the <4>{{environment}}</4> environment. (<5>{{version}}</5>)',
          opsLogDescription: '<0>{{displayName}}</0> - <1>{{description}}</1>.',
          opsLogDescriptionVersion:
            '<0>{{displayName}}</0> - <1>{{description}}</1>. (<5>{{version}}</5>)',
          opsLogProject:
            '<0>{{displayName}}</0> <2>{{changeType}}</2> <3>{{project}}</3> in the <4>{{environment}}</4> environment.',
          opsLogProjectVersion:
            '<0>{{displayName}}</0> <2>{{changeType}}</2> <3>{{project}}</3> in the <4>{{environment}}</4> environment. (<5>{{version}}</5>)',
          created: 'created',
          updated: 'updated',
          updatedFacts: 'updated one or more facts for'
        },
        namespaces: {
          chartTitle: '{{namespace}} Stack Health Score History',
          projects: 'Projects',
          shsHistory: 'Score History',
          stackHealthScore: 'Stack Health Score',
          title: 'Namespaces'
        },
        projectTypes: 'Project Types'
      },
      operationsLog: {
        title: 'Operations Log',
        deleteConfirmation: {
          title: 'Delete Operations Log',
          text: 'Are you sure you would like to delete this Operations Log entry?',
          button: 'Delete'
        },
        create: {
          title: 'Add Operations Log Entry',
          sideBarTitle: 'New Entry'
        },
        entry: 'Operations Log Entry',
        searchHelp: 'Imbi Operations Log Search uses the ',
        searchHelpTitle: 'Operations Log Search Help',
        savingNewEntryTitle: 'Save',
        savingNewEntry: 'Saving new operations log entry',
        savingNewEntryComplete: 'New operations log entry saved',
        environment: 'Environment',
        changeType: 'Change Type',
        description: 'Description',
        notes: 'Notes',
        version: 'Version',
        ticketSlug: 'Ticket Slug',
        link: 'Link',
        project: 'Project',
        recordedAt: 'Recorded At',
        completedAt: 'Completed At',
        recordedBy: 'Recorded By',
        completedAtDescription:
          'When the change completed, if it occurred over a period of time',
        descriptionDescription: 'Single line description of the change',
        versionDescription: 'Version that the change was made for',
        linkDescription: 'Additional context to the ops log entry',
        notesDescription: 'Notes in markdown format',
        requestError:
          'Error making API request for Operations log ({{error}}).',
        validation: {
          changeTypeError:
            'Change type cannot be empty and must be one of the valid options',
          environmentError: 'Environment cannot be empty',
          recordedAtError:
            'Recorded at cannot be empty and must be a valid ISO-8601 datetime string',
          completedAtError:
            'Completed at must either be empty or a valid ISO-8601 datetime string',
          descriptionError: 'Description must either be empty or a string',
          projectError: 'Project must either be or a number',
          versionError: 'Version must either be empty or a string',
          ticketSlugError:
            'Ticket slug must either be empty or a string containing only letters, numbers, hyphen, and underscore',
          linkError: 'Link must either be empty or a string',
          notesError: 'Notes must either be empty or a string'
        }
      },
      project: {
        archived: 'This project is archived and is read-only.',
        attributes: 'Attributes',
        automations: 'Automations',
        configuration: {
          type: 'Configuration Type',
          ssm: {
            name: 'AWS SSM Parameter Store',
            add: 'Add Param',
            saving: 'Saving new parameters',
            savingComplete: 'New parameters saved',
            deleteConfirmation: {
              title: 'Delete SSM Parameters',
              button: 'Delete Checked'
            },
            environmentType: '<0>{{environment}}</0> Type',
            environmentValue: '<0>{{environment}}</0> Value'
          }
        },
        components: {
          activeVersion: 'Active Version',
          singular: 'Component',
          plural: 'Components',
          packageURL: 'Package URL',
          status: 'Status'
        },
        create: {
          namespaceDescription: 'Namespace to create the project in',
          projectTypeDescription: 'Type of the new project'
        },
        createError: 'Error creating project: {{message}}',
        createGitLabRepository: 'Create GitLab Repository',
        createSentryProject: 'Create Project in Sentry',
        createSonarqubeProject: 'Create Project in Sonarqube',
        dashboardCookieCutter: 'Dashboard Cookie Cutter',
        dependencies: {
          title: 'Dependencies',
          add: 'Add Dependency',
          saved: 'Dependency added',
          delete: {
            title: 'Delete Dependency',
            text: 'Are you sure you would like to delete "{{dependency}}" from the list of dependencies for "{{project}}"?',
            success: '"{{dependency}}" deleted from the list of dependencies'
          }
        },
        descriptionDescription:
          'Provide a high-level purpose and context for the project',
        editFacts: 'Edit Project Facts',
        editInfo: 'Edit Project Information',
        editProject: 'Edit Project',
        environments: 'Environments',
        factHistory: 'Fact History',
        feed: {
          title: 'Project Feed',
          created: '<0>{{recordedBy}}</0> created the project.',
          updated: '<0>{{recordedBy}}</0> updated project information.',
          updatedFact:
            '<0>{{recordedBy}}</0> set <1>{{factType}}</1> to <2>{{value}}</2>.',
          opsLog:
            '<0>{{displayName}}</0> <1>{{changeType}}</1> <2>{{project}}</2> in the <3>{{environment}}</3> environment.',
          opsLogVersion:
            '<0>{{displayName}}</0> <1>{{changeType}}</1> <2>{{project}}</2> in the <3>{{environment}}</3> environment. (<4>{{version}}</4>)'
        },
        gitlab: {
          connect: 'Connect to GitLab',
          notConnected:
            'You must connect to GitLab to enable project creation automation features.',
          namespace: 'Gitlab Folder',
          project: 'Gitlab Project',
          creatingInitialCommit: 'Creating Initial Commit',
          initialCommitCreated: 'Initial Commit Created',
          creatingRepo: 'Creating GitLab Repository',
          repoCreated: 'GitLab Repository Created'
        },
        id: 'Project ID',
        identifiers: {
          columns: {
            owner: 'Identifier Owner',
            externalId: 'Identifier'
          },
          addIdentifier: 'Add Identifier',
          deleteTitle: 'Delete {{integrationName}} identifier',
          deleteConfirmation:
            'Are you sure you would like to delete this identifier?',
          externalId: 'External ID',
          integrationName: 'Integration Name',
          identifierTitle: 'Identifier for {{integrationName}}',
          newIdentifier: 'New Identifier'
        },
        links: 'Links',
        linksSaved: 'Links Saved',
        logs: 'Logs',
        name: 'Name',
        nameDescription: 'Human-readable name for this project',
        namespace: 'Namespace',
        notes: {
          content: 'Content',
          new: 'New Note'
        },
        overview: 'Overview',
        projectAttributes: 'Project Attributes',
        projectAutomations: 'Project Automations',
        projectCookieCutter: 'Project Cookie Cutter',
        projectDependencies: 'Project Dependencies',
        projectFacts: 'Project Facts',
        projectHealthScore: 'Project Health Score',
        projectLinks: 'Project Links',
        projectType: 'Project Type',
        projectSaved: 'Project Saved',
        projectURLs: 'Per-Environment URLs',
        savingDependencies: 'Saving Dependencies',
        savingLinks: 'Saving Links',
        savingProject: 'Saving Project',
        savingURLs: 'Saving Per-Environment URLs',
        selectNamespace: 'Select a Namespace',
        sentry: {
          creatingProject: 'Creating project in Sentry',
          projectCreated: 'Project created in Sentry'
        },
        sonarqube: {
          creatingProject: 'Creating project in Sonarqube',
          projectCreated: 'Project created in Sonarqube'
        },
        specifyEnvironments:
          'Environments are required to enter per-environment URLs',
        updateFacts: 'Update Facts',
        urls: 'URLs',
        urlsSaved: 'Per-Environment URLs saved'
      },
      projects: {
        newProject: 'New Project',
        includeArchived: 'Include archived',
        project: 'project',
        projects: 'projects',
        paginationState:
          'Showing {{startRecord}} to {{endRecord}} of {{totalRecords}} {{noun}}',
        requestError:
          'Error making API request for Projects, resetting filters and sort ({{error}}).',
        searchHelpTitle: 'Project Search Help',
        searchHelp: 'Imbi Project Search uses the ',
        searchHelpFields: 'Searchable Fields',
        title: 'Projects'
      },
      reports: {
        available: 'Available Reports',
        componentUsage: {
          title: 'Component Usage',
          columns: {
            active_version: {
              title: 'Active Version',
              description:
                'Version range that is "active". When empty, this component does not impact project scores.' +
                " When set, the score of a project that uses this component is impacted based on whether the project's" +
                ' version *matches* this value.'
            },
            name: {
              title: 'Name',
              description: 'Human-readable name for the component (informative)'
            },
            package_url: {
              title: 'Package URL',
              description:
                'Unique package URL as defined in the [purl-spec](https://github.com/package-url/purl-spec)'
            },
            project_count: {
              title: 'Project Count',
              description:
                'Number of projects using some version of this component'
            },
            status: {
              title: 'Status',
              description:
                'Administrative status for **all** versions of this component. "Forbidden"' +
                'or "Deprecated" components always impact the score of project\'s that use any version of the component.'
            },
            version_count: {
              title: 'Version Count',
              description: 'Number of versions recorded for this component'
            }
          }
        },
        lastUpdated: 'Last Updated: {{lastUpdated}}',
        namespaceKPIs: {
          title: 'Namespace KPIs',
          columns: {
            namespace: { title: 'Namespace' },
            percent_of_tpps: {
              title: 'TPS %',
              description:
                'Total Project Score percentage of the Total Possible Score'
            },
            projects: { title: 'Projects' },
            stack_health_score: {
              title: 'Stack Health Score',
              description:
                'The calculated score indicating the overall health of projects in the namespace'
            },
            total_possible_project_score: {
              title: 'Total Possible Score',
              description:
                'The sum of the maximum possible project scores for all projects in the namespace'
            },
            total_project_score: {
              title: 'Total Project Score',
              description:
                'The sum of the project scores for all projects in the namespace'
            }
          }
        },
        outdatedProjects: {
          title: 'Outdated Projects',
          columns: {
            project_namespace: {
              title: 'Namespace',
              description: 'Human-readable namespace name'
            },
            project_name: {
              title: 'Project Name',
              description: 'Human-readable project name'
            },
            component_score: {
              title: 'Component Score',
              description: "Project's component score out of 100"
            },
            up_to_date: {
              title: 'Up-to-date',
              description: 'Number of up-to-date components'
            },
            deprecated: {
              title: 'Deprecated',
              description: 'Number of deprecated components'
            },
            forbidden: {
              title: 'Forbidden',
              description: 'Number of forbidden components'
            },
            outdated: {
              title: 'Outdated',
              description: 'Number of outdated components'
            }
          }
        },
        projectTypeDefinitions: {
          title: 'Project Type Definitions'
        }
      },
      user: {
        profile: {
          title: "{{displayName}}'s Profile",
          displayName: 'Display Name',
          userName: 'User Name',
          userType: 'User Type',
          externalId: 'External ID',
          emailAddress: 'Email Address',
          groups: 'Groups',
          integrations: 'Integrated Applications'
        },
        settings: {
          title: 'User Settings',
          authenticationTokens: {
            title: 'Authentication Tokens',
            buttonText: 'Generate New Token',
            createdAt: 'Created On',
            expiresAt: 'Expires On',
            lastUsedAt: 'Last Used',
            generate: 'Generate Token',
            generated: 'Token Generated',
            generatedWarning:
              '<p>Make sure to copy your new authentication token.</p><p>You won&rsquo;t be able to see it again!</p>',
            generating: 'Generating Token',
            description:
              'Authentication Tokens are used to access Imbi&rsquo;s <a href="/api-docs" target="_new">API</a>.',
            unused: 'Unused'
          }
        }
      },
      opensearch: {
        dql: 'OpenSearch Dashboards Query Language (DQL)'
      },
      wishedFutureState: {
        configuration:
          'This tab will provide an abstracted interface for editing the configuration in Consul, Vault, and K8s Configuration Maps.'
      }
    }
  }
}
