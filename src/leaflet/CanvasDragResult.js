import PropTypes from 'prop-types'
import debounce from 'lodash-es/debounce'
import memoize from 'lodash-es/memoize'
import React from 'react'

import AwesomeMarkers from '../leaflet/AwesomeMarkers'
import { FeatureGroup, Marker, PropTypes as LeafletPropTypes, Tooltip } from 'react-leaflet'
import GISGeoJSON from '../GISGeoJSON'

import {makeUrl} from '../api'

export const dragIcon = AwesomeMarkers.icon({
  markerColor: 'red',
  prefix: 'fa',
  icon: 'camera-retro',
})

export const LeafletPointShape = PropTypes.shape({lat: PropTypes.number, lng: PropTypes.number})
export const GeoJSONPointShape = PropTypes.shape({
  type: PropTypes.string,
  coordinates: PropTypes.arrayOf(PropTypes.number),
})

export const CanvasDragResultShape = PropTypes.shape({
  number: PropTypes.number,
  fullname: PropTypes.string,
  zipcode: PropTypes.string,
  point: GeoJSONPointShape,
  position: LeafletPointShape,
  edge: PropTypes.any,
})

export class CanvasDragResultDisplay extends React.Component {
  static contextTypes = {
    map: LeafletPropTypes.map,
  }

  static propTypes = {
    target: LeafletPointShape,
    result: CanvasDragResultShape,
  }
  componentDidMount() {
    const {context: {map}} = this
    map.createPane('dragResult').style.zIndex = 250
  }

  render() {
    const {target, result} = this.props
    if (!target || !result) {
      return <div/>
    }
    return <FeatureGroup pane='dragResult'>
      <GISGeoJSON pane='dragResult' data={result.edge}/>
      <Marker pane='dragResult' icon={dragIcon} position={result.position}>
        <Tooltip pane='dragResult'><div>{result.number} {result.fullname} {result.zipcode}</div></Tooltip>
      </Marker>
    </FeatureGroup>
  }
}

const memoizePoint = memoize((lat, lng) => ({lat, lng}), (lat, lng) => JSON.stringify([lat, lng]))

export function getGeoJSONPoint(point) {
  if (!point) {
    return null
  }
  if (point.type === 'Point') {
    return memoizePoint(point.coordinates[1], point.coordinates[0])
  }
  if (point.lat && point.lng) {
    return memoizePoint(point.lat, point.lng)
  }
  throw new Error(JSON.stringify(point))
}

export function CanvasDragResultLookup(Clz) {
  return class CanvasDragResultLookup extends React.Component {
    static propTypes = {
      target: LeafletPointShape,
    }

    state = {
      result: null,
    }

    componentDidMount() {
      this.debouncedDrag()
    }

    componentWillUnmount() {
      this.debouncedDrag.cancel()
    }

    componentDidUpdate() {
      this.debouncedDrag()
    }

    flushDrag = () => {
      this.setState((state, props) => {
        const {target} = props
        if (props.target === state.target) {
          return
        }
        if (target) {
          fetch(makeUrl('api', 'edge/by-point'), {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              point: {
                type: 'Point',
                coordinates: [target.lng, target.lat],
              }
            }),
          }).then(data => data.json()).then(result => {
            this.setState((state, props) => {
              if (props.target === target) {
                const {number, fullname, zipcode, point, edge} = result
                return {result: {number, fullname, zipcode, point, position: getGeoJSONPoint(point), edge}}
              }
            })
          })
        }
        return {result: null, target}
      })
    }

    debouncedDrag = debounce(this.flushDrag, 200)
    render() {
      const {props: {target}, state: {result}} = this
      return <Clz target={target} result={result}/>
    }
  }
}

const CanvasDragResult = CanvasDragResultLookup(CanvasDragResultDisplay)
export default CanvasDragResult


