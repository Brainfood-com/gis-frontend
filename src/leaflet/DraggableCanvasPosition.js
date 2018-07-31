import React from 'react'

import L from 'leaflet'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css'
import 'font-awesome/css/font-awesome.css'
import 'leaflet-geometryutil'
import { FeatureGroup } from 'react-leaflet'
import RotatableMarker from './RotatableMarker'

import * as apiRedux from '../api/redux'
import connectHelper from '../connectHelper'

const overriddenIcon = L.AwesomeMarkers.icon({
  markerColor: 'red',
  prefix: 'fa',
  icon: 'camera-retro',
})
const selectedIcon = L.AwesomeMarkers.icon({
  markerColor: 'white',
  prefix: 'fa',
  iconColor: 'black',
  icon: 'car',
})
const selectedOverridenIcon = L.AwesomeMarkers.icon({
  markerColor: 'red',
  prefix: 'fa',
  iconColor: 'black',
  icon: 'car',
})
const defaultIcon = L.AwesomeMarkers.icon({
  markerColor: 'blue',
  prefix: 'fa',
  icon: 'film',
})
const iconChooser = {
  true: {
    true: selectedOverridenIcon,
    false: selectedIcon,
  },
  false: {
    true: overriddenIcon,
    false: defaultIcon,
  },
}

export default connectHelper({mapStateToProps: apiRedux.mapStateToProps, mapDispatchToProps: apiRedux.mapDispatchToProps})(class DraggableCanvasPosition extends React.Component {
  static defaultProps = {
    onUpdatePoint(id, point) { },
    onCanvasSelect(id) { },
  }

  handleOnClick = event => {
    const {onCanvasSelect, canvas, rangePoint, setPoint} = this.props
    onCanvasSelect(canvas.get('id'))
    if (rangePoint) {
      setPoint(rangePoint.latlng)
    }
  }

  handleOnDragStart = (event) => {
  }

  handleOnDrag = (event) => {
    const {allPoints, setPoint} = this.props
    //console.log('drag', event)
    const {latlng, target} = event
    const {_map: map} = target

    const fixedLatlng = L.GeometryUtil.closest(map, allPoints, latlng)
    //target.setLatLng(fixedLatlng)
    //setPoint(latlng)
  }

  handleOnDragEnd = (event) => {
    const {onUpdatePoint, canvas} = this.props
    onUpdatePoint(canvas, event.target.getLatLng())
  }
  
  render() {
    const {selected, canvas, rangePoint, isFirst, isLast, zoom, fovOrientation} = this.props
    const overrides = canvas.get('overrides') || []
    const {bearing, point} = rangePoint

    const overridePoint = (overrides || []).find(override => override.get('point'))
    const hasOverridePoint = !!overridePoint
    const isFullOpacity = selected || isFirst || isLast || hasOverridePoint

    const markerIcon = iconChooser[selected][hasOverridePoint]
    const isHidden = zoom < 16
    if (isHidden && !isFullOpacity) return <div />
    //rotationAngle={hasOverridePoint ? 180 : 0}
    const rotationAngle = bearing + (fovOrientation === 'left' ? 90 : -90)
    return <FeatureGroup>
      <RotatableMarker
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
    </FeatureGroup>
  }
})

