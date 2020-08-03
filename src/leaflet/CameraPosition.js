import React from 'react'
import PropTypes from 'prop-types'

import L from 'leaflet'
import { Polygon, PropTypes as LeafletPropTypes } from 'react-leaflet'

import Points from './Points'

import { picked } from '../iiif/Picked'

export default picked(['range', 'canvas'])(class CameraPosition extends React.Component {

  static contextTypes = {
    map: LeafletPropTypes.map,
  }

  static defaultProps = {
    fieldOfView: 30,
    depth: 70,
    placement: 'left',

    fieldPathOptions: {
      stroke: true,
      weight: 2,
      opacity: 1,
      strokeColor: 'blue',
      fillOpacity: 0.3,
      fillColor: 'green',
    },
    carPathOptions: {
      opacity: 1,
    },
  }

  static propTypes = {
    fieldOfView: PropTypes.number,
    depth: PropTypes.number,
    position: PropTypes.any,
    heading: PropTypes.number,
    placement: PropTypes.oneOf(['left', 'right']),
    fieldPathOptions: PropTypes.object,
    directionPathOptions: PropTypes.object,
  }

  constructor(props) {
    super(props)
    this.state = {fieldPoints: [], carPoints: []}
  }

  componentWillMount() {
    this.setState(this.processProps(this.state, {}, this.props))
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.processProps(this.state, this.props, nextProps))
  }

  processProps(prevState, prevProps, nextProps) {
    const pickKeys = ['range', 'points', 'canvas', 'zoom']
    let sameValue = 0
    const pickedProps = pickKeys.reduce((result, key) => {
      const {[key]: value} = nextProps
      result[key] = value
      if (prevProps[key] === value) {
        sameValue++
      }
      return result
    }, {})
    if (sameValue === pickKeys.length) {
      const {fieldPoints, carPoints} = prevState
      return {fieldPoints, carPoints}
    }
    const {range, points, canvas, zoom} = pickedProps

    if (!range || !points || !canvas) {
      return {fieldPoints: [], carPoints: []}
    }
    pickedProps.fovAngle = range.get('fovAngle') || 30
    pickedProps.fovDepth = range.get('fovDepth') || 70
    pickedProps.fovOrientation = range.get('fovOrientation', 'left')

    const canvasId = canvas.get('id')
    const rangePoint = points.get(canvasId)
    if (!rangePoint) {
      return {fieldPoints: [], carPoints: []}
    }
    const latlng = rangePoint.get('latlng').toJS()
    const bearing = rangePoint.get('bearing')
    //position, heading, zoom} = pickedProps

    const {map} = this.context
    const {crs} = map.options

    const cartesianPoint = map.project(latlng)

    const m1 = crs.project(latlng)
    const m2 = m1.subtract([zoom < 16 ? 400 : 100, 0])
    const m3 = crs.unproject(m2)
    const m4 = map.latLngToLayerPoint(m3)
    const sizeAdjustRatio = (map.latLngToLayerPoint(latlng).x - m4.x) / 100

    const fieldPoints = this.getFieldPoints(pickedProps)
    const carPoints = this.getCarPoints(pickedProps)

    return {
      fieldPoints: fieldPoints.scale(sizeAdjustRatio).rotate(bearing).center(cartesianPoint).unproject(map).points,
      carPoints: carPoints.scale(sizeAdjustRatio).rotate(bearing).center(cartesianPoint).unproject(map).points,
    }
  }

  /*   
   *      2 _____ 1
   * L2    /     \
   *     3 \     / 0
   * L1     \   /
   *      A2 \ / A1
   * -        C
   */
  getFieldPoints(pickedProps) {
    const {fovAngle, fovDepth, fovOrientation} = pickedProps

    const fieldAngle = (90 - fovAngle / 2) * Points.degreesToRadians

    const A1 = fieldAngle
    const A2 = fieldAngle

    const L2 = fovDepth / 4
    const L1 = L2 * 3
    const cosA1 = Math.cos(A1)
    const cosA2 = Math.cos(A2)
    const sinA1 = Math.sin(A1)
    const sinA2 = Math.sin(A2)

    const points = new Array(6)
    points[0] = {x: 0, y: 0}
    points[1] = L.point(L1 * cosA1, -L1 * sinA1)
    points[2] = L.point(points[1].x - L2 * cosA1, points[1].y - L2 * sinA2)
    points[4] = L.point(-L1 * cosA2, -L1 * sinA2)
    points[3] = L.point(points[4].x + L2 * cosA2, points[4].y - L2 * sinA2)
    points[5] = points[0]

    return new Points(points).rotate(fovOrientation === 'left' ? -90 : 90) 
  }

  /*
   *     __ __ 
   *     \/ \/ 
   *     ++-++
   *    -|   |-
   *     | C |
   *    -|   |-
   *     +---+
   *
   */
  getCarPoints(pickedProps) {
    // Mercedes-Benz Citan Tourer xlg
    const carLength = 4.705
    const carWidth = 1.829
    const headlightBeamLength = 0.5

    const lightAngle = (90 - 30 / 2) * Points.degreesToRadians

    const carWidthHalf = carWidth / 2
    const carWidthQuarter = carWidth / 4
    const carLengthHalf = carLength / 4
    // all basic shapes are 0-based, and will be ratio adjusted and repositioned later
    const shell = [
      {x: carWidthHalf, y: -carLengthHalf},
      {x: -carWidthHalf, y: -carLengthHalf},
      {x: -carWidthHalf, y: carLengthHalf},
      {x: carWidthHalf, y: carLengthHalf},
    ]
    const headlight = [
      {x: 0, y: 0},
      {x: Math.cos(lightAngle) * headlightBeamLength, y: -headlightBeamLength},
      {x: -Math.cos(lightAngle) * headlightBeamLength, y: -headlightBeamLength},
    ]
    return new Points([
      shell,
      new Points(headlight).center({x: -carWidthQuarter, y: -carLengthHalf}),
      new Points(headlight).center({x: carWidthQuarter, y: -carLengthHalf}),
    ]).scale(10)
  }

  render() {
    const {fieldPathOptions, carPathOptions} = this.props
    const {fieldPoints, carPoints} = this.state

    return <div>
      <Polygon {...fieldPathOptions} positions={fieldPoints}/>
      <Polygon {...carPathOptions} positions={carPoints}/>
    </div>
  }
})
