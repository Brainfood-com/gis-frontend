import flow from 'lodash-es/flow'
import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import connectHelper from './connectHelper'
import {BusyPane} from './GlobalBusy'

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
    position: 'relative',
  },
  expanded: {
    margin: [4, 0],
  },
  summary: {
    paddingLeft: 0,
    paddingRight: 0,
    backgroundColor:'white',
  },
  name: {
    color:'black',
    userSelect: 'text',
    cursor: 'initial',
  },
  title: {
    color:'black',
  },
  icon: {
    color:'black',
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

export default flow(connectHelper(itemPanelRedux), withStyles(styles))(class ItemPanel extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string,
    pick: PropTypes.element,
    form: PropTypes.element.isRequired,
    busy: PropTypes.number,
  }

  static defaultProps = {
    expanded: true,
    pick: <div/>,
  }

  constructor(props) {
    super(props)
    this.state = this.updateBusyTimer({}, props)
  }

  updateBusyTimer = (currentState = {}, props) => {
    const {busy} = props
    if (busy) {
      if (currentState.timer) {
        return currentState
      }
      const callback = () => {
        this.setState({busy: true})
      }
      const timer = setTimeout(callback, 250)
      return {timer}
    } else {
      if (currentState.timer) {
        clearTimeout(currentState.timer)
      }
      return {timer: undefined, busy: false}
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.updateBusyTimer(this.state, nextProps))
  }

  handleOnChange = (event, expanded) => {
    const {setExpanded} = this.props
    setExpanded(expanded)
  }

  render() {
    const {className, classes, name, title, pick, form, expanded, icon} = this.props
    const {busy} = this.state

    return <div className={classnames(classes.root, className)}>
      <BusyPane isBusy={busy}>
      <ExpansionPanel classes={{expanded: classes.expanded}} disabled={false} expanded={expanded} onChange={this.handleOnChange}>
        <ExpansionPanelSummary className={classes.summary} expandIcon={<ExpandMoreIcon className={classes.icon}/>} onChange={e => e.preventDefault()} disabled={true}>
          <div>
            {
              icon ?
                <Button color='primary' variant='outlined'>{icon} {name}</Button>
              :
                <Typography onClick={e => e.stopPropagation()} variant='body2' classes={{body2: classes.name}}>{name}</Typography>
            }
            <Typography variant='body2' classes={{body2: classes.title}}>{title}</Typography>
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails className={classes.details}>
          {React.cloneElement(pick)}
          {React.cloneElement(form)}
        </ExpansionPanelDetails>
      </ExpansionPanel>
      </BusyPane>
    </div>
  }
})
