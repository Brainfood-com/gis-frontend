import React from 'react'
import ReactDOM from 'react-dom'
import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'

import L from 'leaflet'
import {DropTarget} from 'react-dnd'
import { PropTypes as LeafletPropTypes } from 'react-leaflet'

import * as apiRedux from '../api/redux'
import connectHelper from '../connectHelper'
import {CanvasCard} from '../iiif/Canvas'
import { picked } from '../iiif/Picked'

const styles = {
  root: {
    width: '100%',
    height: '100%',
  },
}
class CanvasDropTarget extends React.Component {
  static contextTypes = {
    map: LeafletPropTypes.map,
  }

  onUpdatePoint = (canvas, point) => {
    const {range, setRangePoint} = this.props
    const rangeId = range.get('id')
    const canvasId = canvas.get('id')
    setRangePoint(rangeId, canvasId, {sourceId: 'web', priority: 1, point})
  }

  handleOnCanvasDrop(props, monitor) {
    const {range, setRangePoint} = props
    const rangeId = range.get('id')

    const {canvas} = monitor.getItem()
    const canvasId = canvas.get('id')

    const {context: {map}} = this
    const clientRect = ReactDOM.findDOMNode(this).getBoundingClientRect()
    const dropClientOffset = monitor.getClientOffset()
    const containerPoint = L.point(dropClientOffset.x - clientRect.x, dropClientOffset.y - clientRect.y)
    const point = map.containerPointToLatLng(containerPoint)
    setRangePoint(rangeId, canvasId, {sourceId: 'web', priority: 1, point})
  }

  render() {
    const {className, classes, children, connectDropTarget} = this.props
    const wantedClasses = {
      [classes.root]: true,
    }
    return connectDropTarget(<div className={classnames(wantedClasses, className)}>{children}</div>)
  }
}

const dropTypes = [CanvasCard.TYPE]
const dropSpec = {
  drop(props, monitor, component) {
    component.handleOnCanvasDrop(props, monitor)
  },

  hover(props, monitor, component) {

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
