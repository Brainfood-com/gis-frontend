import React from 'react'

import L from 'leaflet'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css'
import 'font-awesome/css/font-awesome.css'
import 'leaflet-geometryutil'
import RotatableMarker from './RotatableMarker'

const overriddenIcon = L.AwesomeMarkers.icon({
  markerColor: 'green',
  prefix: 'fa',
  icon: 'camera-retro',
})
const selectedIcon = L.AwesomeMarkers.icon({
  markerColor: 'white',
  prefix: 'fa',
  iconColor: 'black',
  icon: 'car',
})
const defaultIcon = L.AwesomeMarkers.icon({
  markerColor: 'blue',
  prefix: 'fa',
  icon: 'film',
})

export default class DraggableCanvasPosition extends React.Component {
  static defaultProps = {
    onUpdatePoint(id, point) { },
    onCanvasSelect(id) { },
  }

  handleOnClick = event => {
    const {onCanvasSelect, canvas} = this.props
    onCanvasSelect(canvas.get('id'))
  }

  handleOnDragStart = (event) => {
    console.log('dragstart')
  }

  handleOnDrag = (event) => {
    const {allPoints} = this.props
    //console.log('drag', event)
    const {latlng, target} = event
    const {_map: map} = target

    const fixedLatlng = L.GeometryUtil.closest(map, allPoints, latlng)
    target.setLatLng(fixedLatlng)
  }

  handleOnDragEnd = (event) => {
    const {onUpdatePoint, canvas} = this.props
    onUpdatePoint(canvas, event.target.getLatLng())
  }
  
  render() {
    const {selected, canvas, rangePoint, isFirst, isLast, zoom, fovOrientation} = this.props
    const overrides = canvas.get('overrides')
    const {bearing, point} = rangePoint

    const overridePoint = (overrides || []).find(override => override.get('point'))
    const hasOverridePoint = !!overridePoint
    const isFullOpacity = selected || isFirst || isLast || hasOverridePoint

    const markerIcon = selected ? selectedIcon : hasOverridePoint ? overriddenIcon : defaultIcon
    const isHidden = zoom < 16
    if (isHidden && !isFullOpacity) return <div />
    //rotationAngle={hasOverridePoint ? 180 : 0}
    const rotationAngle = bearing + (fovOrientation === 'left' ? 90 : -90)
    return <RotatableMarker
      icon={markerIcon}
      rotationAngle={rotationAngle}
      draggable={isFullOpacity || !isHidden}
      opacity={isFullOpacity ? 1 : isHidden ? 0 : 0.6}
      position={point ? [point.coordinates[1], point.coordinates[0]] : null}
      onClick={this.handleOnClick}
      onDragstart={this.handleOnDragStart}
      onDrag={this.handleOnDrag}
      onDragend={this.handleOnDragEnd}
      onViewportChange={this.onViewportChange}
      />
  }
}
