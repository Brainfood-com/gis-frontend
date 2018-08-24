import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'

import connectHelper from './connectHelper'

const busyPaneStyles = {
  root: {
    position: 'relative',
  },
  busyContainer: {
    zIndex:5000,
    top:0,
    left:0,
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'black',
    opacity: 0.8,
    display: 'none',
    cursor: 'wait',
  },
  isBusy: {
    '& > $busyContainer': {
      display: 'block',
    },
  },
}

export const BusyPane = withStyles(busyPaneStyles)(class BusyPane extends React.Component {
  static propTypes = {
    isBusy: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
  }

  render() {
    const {className, classes, children, isBusy} = this.props

    return <div className={classnames(classes.root, isBusy && classes.isBusy, className)}>
      {children}
      <div className={classes.busyContainer}/>
    </div>
  }
})

export const GlobalBusy = connectHelper({
  mapStateToProps(store, props) {
    const isBusy = !!(store.application.get('busy') || 0)
    return {isBusy}
  },
})(BusyPane)
