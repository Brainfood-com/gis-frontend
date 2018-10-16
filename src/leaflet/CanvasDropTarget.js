import debounce from 'lodash-es/debounce'
import memoize from 'lodash-es/memoize'
import React from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'

import L from 'leaflet'
import {DropTarget} from 'react-dnd'
import { FeatureGroup, Marker, PropTypes as LeafletPropTypes, Tooltip } from 'react-leaflet'

import * as apiRedux from '../api/redux'
import {makeUrl} from '../api'
import connectHelper from '../connectHelper'
import {CanvasCard} from '../iiif/Canvas'
import { picked } from '../iiif/Picked'
import GISGeoJSON from '../GISGeoJSON'
import RotatableMarker from './RotatableMarker'

const overriddenIcon = L.AwesomeMarkers.icon({
  markerColor: 'red',
  prefix: 'fa',
  icon: 'camera-retro',
})

const styles = {
  root: {
    width: '100%',
    height: '100%',
    zIndex: 1000,
  },
}
class CanvasDropTarget extends React.Component {
  static contextTypes = {
    map: LeafletPropTypes.map,
  }

  constructor(props) {
    super(props)
    this.state = {
      dragLatLng: null,
      dragResult: null,
    }
  }

  flushHover = dragLatLng => {
    if (dragLatLng) {
      fetch(makeUrl('api', 'edge/by-point'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          point: {
            type: 'Point',
            coordinates: [dragLatLng.lng, dragLatLng.lat],
          }
        }),
      }).then(data => data.json()).then(result => {
        this.setState((state, props) => {
          if (state.dragLatLng === dragLatLng) {
            const {number, fullname, zipcode, point, edge} = result
            const dragResult = {number, fullname, zipcode, point, position: this.position(point), edge}
            return {dragResult}
          } else {
            return {dragResult: null}
          }
        })
      })
      return {dragLatLng}
    } else {
      return {dragLatLng, dragResult: null}
    }
  }

  debouncedHover = debounce(this.flushHover, 200)

  handleOnHover(monitor) {
    const dragLatLng = this.monitorToPoint(monitor)
    this.setState((state, props) => {
      return {dragLatLng}
    })
    this.debouncedHover(dragLatLng)
  }

  position = memoize(point => point ? [point.coordinates[1], point.coordinates[0]] : null)

  onUpdatePoint = (canvas, point) => {
    const {range, setRangePoint} = this.props
    const rangeId = range.get('id')
    const canvasId = canvas.get('id')
    setRangePoint(rangeId, canvasId, {sourceId: 'web', priority: 1, point})
  }

  monitorToPoint(monitor) {
    const {context: {map}} = this
    const clientRect = ReactDOM.findDOMNode(this).getBoundingClientRect()
    const dropClientOffset = monitor.getClientOffset()
    const containerPoint = L.point(dropClientOffset.x - clientRect.x, dropClientOffset.y - clientRect.y)
    return map.containerPointToLatLng(containerPoint)
  }

  handleOnCanvasDrop(props, monitor) {
    const point = this.monitorToPoint(monitor)

    const {range, setRangePoint} = props
    const rangeId = range.get('id')

    const {canvas} = monitor.getItem()
    const canvasId = canvas.get('id')

    setRangePoint(rangeId, canvasId, {sourceId: 'web', priority: 1, point})
    this.setState((state, props) => {
      return {dragLatLng: null, dragResult: null}
    })
  }

  render() {
    const {className, classes, children, connectDropTarget} = this.props
    const {context: {map}} = this

    const wantedClasses = {
      [classes.root]: true,
    }
    const {dragResult} = this.state
    return connectDropTarget(
      <div className={classnames(wantedClasses, className)}>
        <FeatureGroup>
          {dragResult ? <GISGeoJSON data={dragResult.edge}/> : null}
          {dragResult ? <Marker icon={overriddenIcon} position={dragResult.position} title="foo" alt="bar">
            <Tooltip><div>
              {dragResult.number} {dragResult.fullname} {dragResult.zipcode}
            </div></Tooltip>
          </Marker>
          : null}
          {dragResult ?<Tooltip position={dragResult.position}><div>
            {dragResult.number} {dragResult.fullname} {dragResult.zipcode}
          </div></Tooltip>
          : null}
          {children}
        </FeatureGroup>
      </div>
    )
  }
}

const dropTypes = [CanvasCard.TYPE]
const dropSpec = {
  drop(props, monitor, component) {
    component.handleOnCanvasDrop(props, monitor)
  },

  hover(props, monitor, component) {
    component.handleOnHover(monitor)
  },

  canDrop(props, monitor) {
	  return true
  },
}
const dropCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  isOverCurrent: monitor.isOver({ shallow: true }),
  canDrop: monitor.canDrop(),
  itemType: monitor.getItemType(),
})


export default picked(['range', 'canvas'])(withStyles(styles)(DropTarget(dropTypes, dropSpec, dropCollect)(CanvasDropTarget)))
