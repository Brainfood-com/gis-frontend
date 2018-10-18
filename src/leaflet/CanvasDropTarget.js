import React from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'

import L from 'leaflet'
import {DropTarget} from 'react-dnd'
import { FeatureGroup, PropTypes as LeafletPropTypes } from 'react-leaflet'

import * as apiRedux from '../api/redux'
import connectHelper from '../connectHelper'
import {CanvasCard} from '../iiif/Canvas'
import { picked } from '../iiif/Picked'
import CanvasDragResult, {getGeoJSONPoint} from './CanvasDragResult'

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
      isOver: false,
    }
  }

  handleOnHover(monitor) {
    const dragLatLng = this.monitorToPoint(monitor)
    const isOver = monitor.isOver()
    this.setState((state, props) => {
      return {dragLatLng: isOver ? dragLatLng : null}
    })
  }

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
    return getGeoJSONPoint(map.containerPointToLatLng(containerPoint))
  }

  handleOnCanvasDrop(props, monitor) {
    console.log('handleOnCanvasDrop')
    const point = this.monitorToPoint(monitor)

    const {range, setRangePoint} = props
    const rangeId = range.get('id')

    const {canvas} = monitor.getItem()
    const canvasId = canvas.get('id')

    setRangePoint(rangeId, canvasId, {sourceId: 'web', priority: 1, point})
    this.setState((state, props) => {
      return {dragLatLng: null}
    })
  }
  componentDidUpdate(prevProps, prevState) {
    const {canDrop, isOver, isOverCurrent} = this.props
    const {dragLatLng} = this.state
    if (!canDrop && dragLatLng) {
      this.setState({dragLatLng: null})
      return
    }
  }

  render() {
    const {className, classes, children, connectDropTarget} = this.props
    const {isOver, isOverCurrent} = this.props
    const {context: {map}} = this

    const wantedClasses = {
      [classes.root]: true,
    }
    const {dragLatLng} = this.state
    return connectDropTarget(<div className={classnames(wantedClasses, className)} style={{zIndex:1000}}>
      <FeatureGroup>
        <CanvasDragResult target={dragLatLng}/>
        <div style={{zIndex: 1000}}>{children}</div>
      </FeatureGroup>
    </div>)
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
