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
import CanvasDragResult, {getGeoJSONPoint} from './CanvasDragResult'

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

  constructor(props) {
    super(props)
    const {point} = props.rangePoint.point
    this.state = {
      dragLatLng: null,
    }
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
    const {latlng} = event

    this.setState({dragLatLng: latlng})
  }

  handleOnDragEnd = (event) => {
    const {onUpdatePoint, canvas} = this.props
    onUpdatePoint(canvas, event.target.getLatLng())
    this.setState({dragLatLng: null})
  }

  render() {
    const {selected, canvas, rangePoint, isFirst, isLast, zoom, fovOrientation} = this.props
    const overrides = canvas.get('overrides') || []
    const {bearing, point} = rangePoint
    const {dragLatLng} = this.state

    const overridePoint = (overrides || []).find(override => {
      if (!override.get) {
        debugger
      }
      return override.get('point')
    })
    const hasOverridePoint = !!overridePoint
    const isFullOpacity = selected || isFirst || isLast || hasOverridePoint

    const markerIcon = iconChooser[selected][hasOverridePoint]
    const isHidden = zoom < 16
    if (isHidden && !isFullOpacity) return <div />
    //rotationAngle={hasOverridePoint ? 180 : 0}
    const rotationAngle = bearing + (fovOrientation === 'left' ? 90 : -90)

    return <FeatureGroup>
      <CanvasDragResult target={dragLatLng}/>
      <RotatableMarker
        icon={markerIcon}
        rotationAngle={rotationAngle}
        draggable={isFullOpacity || !isHidden}
        opacity={isFullOpacity ? 1 : isHidden ? 0 : 0.6}
        position={getGeoJSONPoint(point)}
        onClick={this.handleOnClick}
        onDragstart={this.handleOnDragStart}
        onDrag={this.handleOnDrag}
        onDragend={this.handleOnDragEnd}
        onViewportChange={this.onViewportChange}
        >
      </RotatableMarker>
    </FeatureGroup>
  }
})

