import flow from 'lodash-es/flow'
import React from 'react'

import AwesomeMarkers from '../leaflet/AwesomeMarkers'
import 'leaflet-geometryutil'
import { FeatureGroup } from 'react-leaflet'
import RotatableMarker from './RotatableMarker'

import * as apiRedux from '../api/redux'
import connectHelper from '../connectHelper'
import {checkPermission, picked as userPicked} from '../User'
import CanvasDragResult, {getGeoJSONPoint} from './CanvasDragResult'
import { rangeRequiredRole } from '../iiif/Range'

const overriddenIcon = AwesomeMarkers.icon({
  markerColor: 'red',
  prefix: 'fa',
  icon: 'camera-retro',
})
const selectedIcon = AwesomeMarkers.icon({
  markerColor: 'white',
  prefix: 'fa',
  iconColor: 'black',
  icon: 'car',
})
const selectedOverridenIcon = AwesomeMarkers.icon({
  markerColor: 'red',
  prefix: 'fa',
  iconColor: 'black',
  icon: 'car',
})
const defaultIcon = AwesomeMarkers.icon({
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

export default flow(userPicked('permissions'), connectHelper({mapStateToProps: apiRedux.mapStateToProps, mapDispatchToProps: apiRedux.mapDispatchToProps}))(class DraggableCanvasPosition extends React.Component {
  static defaultProps = {
    onUpdatePoint(id, point) { },
    onCanvasSelect(id) { },
  }

  constructor(props) {
    super(props)
    this.state = {
      dragLatLng: null,
    }
  }

  skipChange = name => {
    const {permissions, range} = this.props
    return !checkPermission(permissions, rangeRequiredRole(range), 'canvas', name)
  }

  handleOnClick = event => {
    const {onCanvasSelect, canvas, rangePoint, setPoint} = this.props
    onCanvasSelect(canvas.get('id'))
    if (rangePoint) {
      setPoint(rangePoint.get('latlng'))
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
    const overrides = canvas.get('overrides', [])
    const bearing = rangePoint.get('bearing')
    const point = rangePoint.get('point')
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

    const isDraggable = (isFullOpacity || !isHidden) && !this.skipChange('override')
    return <FeatureGroup>
      <CanvasDragResult target={dragLatLng}/>
      <RotatableMarker
        icon={markerIcon}
        rotationAngle={rotationAngle}
        draggable={isDraggable}
        opacity={isFullOpacity ? 1 : isHidden ? 0 : 0.6}
        position={getGeoJSONPoint(point.toJS())}
        onClick={this.handleOnClick}
        onDragstart={this.handleOnDragStart}
        onDrag={this.handleOnDrag}
        onDragend={this.handleOnDragEnd}
        >
      </RotatableMarker>
    </FeatureGroup>
  }
})

