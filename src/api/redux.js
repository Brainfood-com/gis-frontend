import L from 'leaflet'

import {makeUrl} from '../api'
import GeoServerUtil from './GeoServerUtil'

const geoserver = makeUrl('geoserver', 'geoserver')
//window.location.href.replace(/(https?:\/\/)(.*\.)?gis(?:-app)?(\.[^:\/]+(:\d+)?).*/, '$1geoserver.gis$3/geoserver')
export const geoserverUtil = new GeoServerUtil({
  servers: {
    'app': {
      url: geoserver,
      username: 'admin',
      password: 'geoserver',
    },
  },
})

/*
 *  typeName<String>
 *  point<LatLng>
 *  distance<Number>
 *  features<Array<GeoJSON?>>
 *
 */

const valueConvertors = {
  point: L.latLng,
}
const defaultState = {}

export function reducer(state = defaultState, action) {
  if (action.type !== 'geoserver') {
    return state
  }
  const changedData = {}
  const foundKeys = ['typeName', 'point', 'distance', 'features'].filter(key => action[key] !== undefined)
  if (foundKeys.length === 0) {
    return state
  }
  if (action.features) {
    const {typeName, point, distance} = action.check
    if (state.typeName === typeName && state.point === point && state.distance === distance) {
      return {...state, features: action.features}
    } else {
      return state
    }
  }
  return foundKeys.reduce((newState, key) => (newState[key] = action[key], newState), {...state})
}


const doCall = toMerge => async (dispatch, getState) => {
  const currentState = getState().geoserver
  const changedEntries = Object.entries(toMerge).map(entry => {
    const [key, value] = entry
    const {[key]: valueConvertor} = valueConvertors
    if (valueConvertor) {
      return [key, valueConvertor(value)]
    } else {
      return entry
    }
  }).filter(([key, value]) => {
    const {[key]: currentValue} = currentState
    if (value && value.equals) {
      return !value.equals(currentValue)
    } else {
      return value !== currentValue
    }
  })
  if (changedEntries.length === 0) {
    return
  }
  const changedData = {}
  changedEntries.forEach(([key, value]) => changedData[key] = value)
  const {typeName, point, distance} = {...currentState, ...changedData}
  dispatch({type: 'geoserver', ...changedData})
  if (!typeName || !point || !distance) {
    return
  }

  const bounds = point.toBounds(distance)
  const bbox = bounds.toBBoxString()
  const features = await geoserverUtil.fetch({server: 'app', workspace: 'gis', typeName, bbox})
  dispatch({type: 'geoserver', features, check: {typeName, point, distance}})
}


export const setTypeName = typeName => doCall({typeName})
export const setPoint = point => doCall({point})
export const setDistance = distance => doCall({distance})

export function mapStateToProps(state, props) {
  const {geoserver} = state
  const {point, features} = geoserver
  return {viewPoint: point, viewFeatures: features}
}

export function mapDispatchToProps(dispatch, props) {
  return {
    setPoint(point) { dispatch(setPoint(point))},
  }
}






