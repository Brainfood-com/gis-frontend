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
import {checkPermissions, picked as userPicked} from './User'

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
    //width: '20%',
    maxWidth: '20%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
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
    overflowY: 'auto',
    overflowX: 'auto',
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
  hasIIIFTree: {},
  hasIIIFCanvasSlidingList: {},
  hasSearchMap: {},
  hasSearchResults: {},
}
class GISControl extends React.Component {
  render() {
    const {children, classes, permissions} = this.props
    const hasIIIFTree = checkPermissions(permissions, null, 'iiif', 'tree')
    const hasIIIFCanvasSlidingList = checkPermissions(permissions, null, 'iiif', 'canvas_sliding_list')
    const hasSearchMap = checkPermissions(permissions, null, 'search', 'map')
    const hasSearchResults = checkPermissions(permissions, null, 'search', 'results')
    const rootClasses = {
      [classes.hasIIIFTree]: hasIIIFTree,
      [classes.hasIIIFCanvasSlidingList]: hasIIIFCanvasSlidingList,
      [classes.hasSearchMap]: hasSearchMap,
      [classes.hasSearchResults]: hasSearchResults,
    }
    console.log('gis-control', {foo: permissions.toJS(), hasIIIFTree, hasIIIFCanvasSlidingList, hasSearchResults})
    return <div className={classnames(classes.root, rootClasses)}>
      <div className={classes.mapViewTop}>
        <div className={classes.mapViewLeft}>
          {hasIIIFTree ? <IIIFTree/> : null}
        </div>
        <div className={classes.mapViewMiddle}>
          {hasSearchMap ? <GISMap/> : null}
        </div>
        <div className={classes.mapViewRight}>
          {hasSearchResults ? <CurrentBuildingInfo/> : null}
        </div>
      </div>
      <div className={classes.mapViewBottom}>
        <div className={classes.mapViewBottomLeft}>
          {hasIIIFCanvasSlidingList ? <CanvasSlidingList/> : null}
        </div>
      </div>
    </div>
  }
}

export default flow(userPicked('permissions'), withStyles(styles))(GISControl)
