import debounce from 'lodash-es/debounce'
import memoize from 'lodash-es/memoize'
import React from 'react'

import L from 'leaflet'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css'
import 'font-awesome/css/font-awesome.css'
import 'leaflet-geometryutil'
import { FeatureGroup } from 'react-leaflet'
import GISGeoJSON from '../GISGeoJSON'
import RotatableMarker from './RotatableMarker'

import * as apiRedux from '../api/redux'
import {makeUrl} from '../api'
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

  constructor(props) {
    super(props)
    const {point} = props.rangePoint.point
    this.state = {
      dragLatLng: null,
      pointEdge: [],
    }
  }

  flushDrag = () => {
    this.setState((state, props) => {
      const {dragLatLng} = state
      if (!dragLatLng) {
        return
      }
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
          if (state.dragLatLng) {
            return {pointEdge: result.edge}
          }
        })
      })
    })
  }

  debouncedDrag = debounce(this.flushDrag, 200)

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
    const {latlng, target: {_map: map}} = event

    this.setState({dragLatLng: latlng})
    this.debouncedDrag()
  }

  handleOnDragEnd = (event) => {
    const {onUpdatePoint, canvas} = this.props
    onUpdatePoint(canvas, event.target.getLatLng())
    this.setState({dragLatLng: null, pointEdge: []})
    this.debouncedDrag.cancel()
  }

  position = memoize(point => point ? [point.coordinates[1], point.coordinates[0]] : null)

  render() {
    const {selected, canvas, rangePoint, isFirst, isLast, zoom, fovOrientation} = this.props
    const overrides = canvas.get('overrides') || []
    const {bearing, point} = rangePoint

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
      <GISGeoJSON data={this.state.pointEdge}/>
      <RotatableMarker
        icon={markerIcon}
        rotationAngle={rotationAngle}
        draggable={isFullOpacity || !isHidden}
        opacity={isFullOpacity ? 1 : isHidden ? 0 : 0.6}
        position={this.position(point)}
        onClick={this.handleOnClick}
        onDragstart={this.handleOnDragStart}
        onDrag={this.handleOnDrag}
        onDragend={this.handleOnDragEnd}
        onViewportChange={this.onViewportChange}
        />
    </FeatureGroup>
  }
})

