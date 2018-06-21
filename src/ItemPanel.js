import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import Typography from '@material-ui/core/Typography'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import connectHelper from './connectHelper'

const defaultState = JSON.parse(localStorage.getItem('gis-app.panel')) || {}

export function reducer(state = defaultState, {type, name, expanded}) {
  if (type !== 'panel') {
    return state
  }
  if (name) {
    if (expanded) {
      state = {...state, [name]: true}
    } else {
      state = {...state}
      delete state[name]
    }
    if (Object.keys(state).length > 0) {
      localStorage.setItem('gis-app.panel', JSON.stringify(state))
    } else {
      localStorage.removeItem('gis-app.panel')
    }
  }
  return state
}

const itemPanelRedux = {
  mapStateToProps(state, props) {
    const {name} = props
    const expanded = !state.panel[name]
    return {expanded}
  },

  mapDispatchToProps(dispatch, props) {
    const {name} = props
    return {
      setExpanded(expanded) {
        dispatch({type: 'panel', name, expanded: !expanded})
      },
    }
  }
}

// TODO: Use the theme size instead of hard-coded 4 and 8
const styles = {
  root: {
  },
  expanded: {
    margin: [4, 0],
  },
  summary: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  details: {
    borderTop: '1px solid black',
    borderBottom: '1px solid black',
    flexDirection: 'column',
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
  },
}

export default _.flow(connectHelper(itemPanelRedux), withStyles(styles))(class ItemPanel extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    pick: PropTypes.element.isRequired,
    form: PropTypes.element.isRequired,
  }

  static defaultProps = {
    expanded: true,
  }

  handleOnChange = (event, expanded) => {
    const {setExpanded} = this.props
    setExpanded(expanded)
  }

  render() {
    const {className, classes, title, pick, form, expanded} = this.props

    return <ExpansionPanel className={classnames(classes.root, className)} classes={{expanded: classes.expanded}} expanded={expanded} onChange={this.handleOnChange}>
      <ExpansionPanelSummary className={classes.summary} expandIcon={<ExpandMoreIcon />}>
        <Typography variant='title'>{title}</Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails className={classes.details}>
        {React.cloneElement(pick)}
        {React.cloneElement(form)}
      </ExpansionPanelDetails>
    </ExpansionPanel>
  }
})
