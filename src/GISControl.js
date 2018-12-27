import flow from 'lodash-es/flow'
import React from 'react'

import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'

import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'

import GISMap from './GISMap'
import GISResultsPane from './GISResultsPane'
import {CurrentBuildingInfo} from './GISSearch'

import {CanvasSlidingList} from './iiif/Canvas'
import {IIIFTree} from './IIIF'

/*
 *  /---------------+--------\
 *  |left|          |pic-view|
 *  |    +----------+--------+
 *  |    |timeline           |
 *  \----+-------------------/
 */

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
    height: '100%',
  },
  mapViewLeft: {
    width: '20%',
    maxWidth: '20%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'scroll',
  },
  mapViewMiddle: {
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
    width: '100%',
  },
  mapViewRight: {
    maxWidth: '25%',
    //minWidth: 100,
    overflowY: 'scroll',
  },
  mapViewBottom: {
    display: 'flex',
    flexGrow:0,
    flexShrink:0,
    flexDirection: 'row',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
  },
  mapViewTop: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
  },
  mapViewBottomLeft: {
    width: '100%',
  },
  mapViewBottomRight: {
    width: '20%',
    minWidth: 100,
  },
}
class GISControl extends React.Component {
  render() {
    const {children, classes} = this.props
    return <div className={classes.root}>
      <div className={classes.mapViewTop}>
        <div className={classes.mapViewLeft}>
          <IIIFTree/>
        </div>
        <div className={classes.mapViewMiddle}>
          <GISMap/>
        </div>
        <div className={classes.mapViewRight}>
          <CurrentBuildingInfo/>
        </div>
      </div>
      <div className={classes.mapViewBottom}>
        <div className={classes.mapViewBottomLeft}>
          <CanvasSlidingList/>
        </div>
      </div>
    </div>
  }
}

export default flow(withStyles(styles))(GISControl)
