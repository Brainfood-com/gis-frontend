import flow from 'lodash-es/flow'
import isEqual from 'lodash-es/isEqual'
import Enum from 'es6-enum'
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
import {checkPermission, picked as userPicked} from './User'
import { immutableEmptyMap, immutableEmptyOrderedMap } from './constants'
import connectHelper from './connectHelper'


const dallas_center = [32.781132, -96.797271]
const la_center = [34.0522, -118.2437]

const ACTION = Enum(
  'set-viewport',
)

const defaultState = immutableEmptyMap.withMutations(map => {
  map.merge({
    center: la_center,
    zoom: 11,
  })
})

export function reducer(state = defaultState, {type, actionType, ...rest}) {
  if (type !== 'control') {
    return state
  }
  switch (actionType) {
    case ACTION['set-viewport']:
      if (!isEqual(rest.center, state.get('center'))) {
        state = state.set('center', rest.center)
      }
      state = state.set('zoom', rest.zoom)
      break
  }
  return state
}

export function setViewport({center, zoom}) {
  return {type: 'control', actionType: ACTION['set-viewport'], center, zoom}
}

export function picked(...items) {
  return Component => {
    function mapStateToProps(store, props) {
      const state = store.control
      const result = {}
      items.forEach(item => {
        switch (item) {
          case 'viewport':
            result.center = state.get('center')
            result.zoom = state.get('zoom')
            break
        }
      })
      return result
    }

    function mapDispatchToProps(dispatch, ownProps) {
      const result = {}
      items.forEach(item => {
        switch (item) {
          case 'viewport':
            result.setViewport = args => dispatch(setViewport(args))
            break
        }
      })
      return result
    }

    return connectHelper({mapStateToProps, mapDispatchToProps})(Component)
  }
}

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
  handleOnViewportChange = ({center, zoom}) => {
    this.props.setViewport({center, zoom})
  }

  render() {
    const {children, classes, center, zoom, permissions} = this.props
    const hasIIIFTree = checkPermission(permissions, null, 'iiif', 'tree')
    const hasIIIFCanvasSlidingList = checkPermission(permissions, null, 'iiif', 'canvas_sliding_list')
    const hasSearchMap = checkPermission(permissions, null, 'search', 'map')
    const hasSearchResults = checkPermission(permissions, null, 'search', 'results')
    const rootClasses = {
      [classes.hasIIIFTree]: hasIIIFTree,
      [classes.hasIIIFCanvasSlidingList]: hasIIIFCanvasSlidingList,
      [classes.hasSearchMap]: hasSearchMap,
      [classes.hasSearchResults]: hasSearchResults,
    }
    return <div className={classnames(classes.root, rootClasses)}>
      <div className={classes.mapViewTop}>
        <div className={classes.mapViewLeft}>
          {hasIIIFTree ? <IIIFTree/> : null}
        </div>
        <div className={classes.mapViewMiddle}>
          {hasSearchMap ? <GISMap center={center} zoom={zoom} onViewportChange={this.handleOnViewportChange}/> : null}
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

export default flow(picked('viewport'), userPicked('permissions'), withStyles(styles),)(GISControl)
