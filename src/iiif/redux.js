import Enum from 'es6-enum'
import Immutable from 'immutable'

import GeometryUtil from 'leaflet-geometryutil'

import {makeUrl} from '../api'

const ACTION = Enum(
  'set',
  'delete',
  'clear',
)
const iiifTypeToModelType = {
  'sc:Collection': 'collection',
  'sc:Manifest': 'manifest',
  'sc:Range': 'range',
  'sc:Canvas': 'canvas',
}
export const MODEL = Enum(
  'collection',
  'manifest',
  'range',
  'canvas',

  'range_points',
  'picked',
)

const defaultState = Immutable.Map().withMutations(map => {
  map.set(MODEL['collection'], Immutable.OrderedMap())
  map.set(MODEL['manifest'], Immutable.OrderedMap())
  map.set(MODEL['range'], Immutable.OrderedMap())
  map.set(MODEL['range_points'], Immutable.OrderedMap())
  map.set(MODEL['canvas'], Immutable.OrderedMap())
  map.set(MODEL['picked'], Immutable.Map().withMutations(map => {
    const picked = JSON.parse(localStorage.getItem('gis-app.picked')) || {}
    Object.keys(picked).forEach(key => {
      const {[key]: value} = picked
      if (!!value) {
        map.set(key, Immutable.Map({id: key, value}))
      }
    })
  }))
})


/*
  Brief: {
    id<Number>,
    label<String>,
    type<String>,
  }
  GET:/collection 
  CollectionList: [<CollectionBrief>]
  CollectionBrief<Brief>: {
  }
  GET:/collection/:id
  Collection<CollectionBrief>: {
    *externalId<String>,
    id<Number>,
    label<String>,
    members: [<MemberBrief>],
    type<String>,
  }
  MemberBrief<Brief>: {
  }
  GET:/manifest/:id
  Manifest<MemberBrief>: {
    attribution<String>,
    description<String>,
    *externalId<String>,
    license<String>,
    logo<String>,
    structures: [<RangeBrief>],
    viewingHint<String>,
  }
  RangeBrief<Brief>: {
    pointOverrideCount<Number>,
    viewingHint,
  }
  Range<RangeBrief>: {
    canvases: [<String>],
    *externalId<String>,
    pointOverrideCount,
    ranges: [<RangeBrief>],
    viewingHint,
  }
  RangePoints: {
    id<String>, // -> Range
    points: [<RangePoint>],
  }
  RangePoint: {

  }
  Canvas<Brief>: {
    *externalId<String>,
    format<String>,
    height<Number>,
    image<String>,
    id<Number>,
    thumbnail<String>,
    width<Number>,
  }

*/
export function reducer(state = defaultState, {type, actionType, modelType, itemOrItems, ...action}) {
  if (type !== 'redux-iiif') {
    return state
  }
  const existingModelValue = state.get(modelType)
  switch (actionType) {
    case ACTION.clear:
      return state.set(modelType, existingModelValue.clear())
      break
  }
  let itemHandler
  switch (actionType) {
    // brief types
    case ACTION.set:
      itemHandler = (map, item) => {
        if (!!!item) debugger
        const {id} = item
        const currentValue = map.get(id)
        if (!currentValue) {
          return map.set(id, Immutable.Map(item))
        } else {
          return map.set(id, currentValue.merge(item))
        }
      }
      break
    case ACTION.delete:
      itemHandler = (map, item) => map.delete(item.id)
      break
  }
  if (Array.isArray(itemOrItems)) {
    const singletonHandler = itemHandler
    itemHandler = (map, items) => map.withMutations(map => items.map(item => singletonHandler(map, item)))
  }
  const newModelValue = itemHandler(existingModelValue, itemOrItems)
  switch (modelType) {
    case MODEL['picked']:
      const newPicked = newModelValue.reduce((result, value, key, newPicked) => {
        const id = value.get('value')
        if (!!id) {
          result[key] = id
        }
        return result
      }, {})
      localStorage.setItem('gis-app.picked', JSON.stringify(newPicked))
      break
  }
  //console.log('reducer', actionType, modelType, itemOrItems, newModelValue.toJSON())
  return state.set(modelType, newModelValue)
}

const json = promise => promise.then(data => data.json())

export const pick = (type, id) => {
  if (!!id) {
    if (typeof id !== 'number') {
      debugger
    }
    return {type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['picked'], itemOrItems: {id: type, value: id}}
  } else {
    return {type: 'redux-iiif', actionType: ACTION.delete, modelType: MODEL['picked'], itemOrItems: {id: type}}
  }
}

export const startOfDay = () => async (dispatch, getState) => {
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['collection']})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['manifest']})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['range']})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['range_points']})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['canvas']})
  const collections = await fetch(makeUrl('api', 'collection')).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['collection'], itemOrItems: collections})
  getState().iiif.get(MODEL['picked']).reduce((fetchers, value, key, picked) => {
    const id = value.get('value')
    if (!!!id) {
      return
    }
    const {[key]: handlers = [id => null]} = fetchers
    handlers.forEach(handler => dispatch(handler(id)))
    return fetchers
  }, {
    collection: [getCollection],
    manifest: [getManifest, getManifestStructures],
    range: [getRange, getRangePoints],
    canvas: [getCanvas],
  })
}

const buildUpdater = (model, keys, urlBuilder, getModel) => (id, data) => async (dispatch, getState) => {
  try {
    const object = getState().iiif.getIn([model, id])
    const dataToSend = keys.reduce((result, key) => {
      const value = data[key]
      result[key] = !!value ? value : object.get(key)
      return result
    }, {})
    dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: model, itemOrItems: {id, ...dataToSend}})
		await fetch(urlBuilder(id), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    })
  } finally {
    dispatch(getModel(id))
  }
}

const requiredId = chain => id => !!id ? chain(id) : dispatch => {}

export const getCollection = requiredId(collectionId => async dispatch => {
  const collectionDetail = await fetch(makeUrl('api', `collection/${collectionId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['manifest'], itemOrItems: collectionDetail.manifests})
  collectionDetail.manifests = collectionDetail.manifests.map(manifest => manifest.id)
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['collection'], itemOrItems: collectionDetail})
})

export const updateCollection = buildUpdater(MODEL['collection'], ['notes', 'tags'], id => makeUrl('api', `collection/${id}`), getCollection)

export const getManifest = requiredId(manifestId => async dispatch => {
  const manifestDetail = await fetch(makeUrl('api', `manifest/${manifestId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['manifest'], itemOrItems: manifestDetail})
})

export const updateManifest = buildUpdater(MODEL['manifest'], ['notes', 'tags'], id => makeUrl('api', `manifest/${id}`), getManifest)

export const getManifestStructures = requiredId(manifestId => async dispatch => {
  const manifestStructures = await fetch(makeUrl('api', `manifest/${manifestId}/structures`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: manifestStructures})
  const ranges = []
  const rangesWithCanvases = []
  const foundCanvasIds = {}
  manifestStructures.forEach(structure => {
    const {id} = structure
    if (structure.canvases) {
      structure.label += `(${structure.canvases.length})`
      if (structure.canvases.length) {
        rangesWithCanvases.push(id)
        structure.canvases.forEach(id => foundCanvasIds[id] = id)
      }
    }
    if (structure.pointOverrideCount) {
      structure.label += `(p=${structure.pointOverrideCount})`
    }
    ranges.push(id)
  })
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['canvas'], itemOrItems: Object.values(foundCanvasIds).map(id => ({id, type: 'canvas'}))})
  const manifestDetail = {
    id: manifestId,
    ranges,
    rangesWithCanvases,
  }
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['manifest'], itemOrItems: manifestDetail})
})


export const getRange = requiredId(rangeId => async dispatch => {
  const rangeDetail = await fetch(makeUrl('api', `range/${rangeId}`)).then(data => data.json())
  //dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: rangeDetail.structures})
  //rangeDetail.ranges = rangeDetail.ranges.map(range => range.id)
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: rangeDetail})
})

export const updateRange = buildUpdater(MODEL['range'], ['notes', 'fovAngle', 'fovDepth', 'fovOrientation', 'tags'], id => makeUrl('api', `range/${id}`), getRange)

export const getRangePoints = requiredId(rangeId => async (dispatch, getState) => {
  let pickedId = getState().iiif.getIn([MODEL['picked'], 'canvas', 'value'])

  const canvasPoints = await fetch(makeUrl('api', `range/${rangeId}/canvasPoints`)).then(data => data.json())

  const canvases = new Array(canvasPoints.length)
  const points = new Array(canvasPoints.length)
  const bearingPoints = new Array(2)
  canvasPoints.forEach((canvasPoint, index) => {
    const {id, format, height, image, thumbnail, width, external_id: externalId, label, overrides, point, ...canvasPointRest} = canvasPoint
    canvases[index] = {id, format, height, image, thumbnail, width, externalId, label, overrides}

    const latlng = bearingPoints[1] = {
      lat: point.coordinates[1],
      lng: point.coordinates[0],
    }
    points[index] = {id, point, latlng, ...canvasPointRest}
    if (index > 0) {
      points[index - 1].bearing = GeometryUtil.bearing(...bearingPoints)
    }
    bearingPoints[0] = bearingPoints[1]
  })
  points[points.length - 1].bearing = points[points.length - 2].bearing

  const pointsMap = Immutable.OrderedMap().withMutations(map => points.forEach(point => map.set(point.id, point)))

  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: {id: rangeId, canvases: canvases.map(canvas => canvas.id)}})
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['canvas'], itemOrItems: canvases})
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range_points'], itemOrItems: {id: rangeId, points: pointsMap}})
  if (!!pickedId && !canvasPoints.find(canvasPoint => pickedId === canvasPoint.id)) {
    pickedId = null
  }
  if (!!!pickedId && canvases.length) {
    dispatch(pick('canvas', canvases[0].id))
  }
})

export const setRangePoint = (rangeId, canvasId, {sourceId, priority, point}) => async dispatch => {
  try {
		await fetch(makeUrl('api', `canvas/${canvasId}/point/${sourceId}`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        priority,
        point: point ? {
          type: 'Point',
          coordinates: [point.lng, point.lat],
        } : null,
      }),
    })
  } finally {
    if (!!rangeId) {
      dispatch(getRangePoints(rangeId))
    }
    dispatch(getCanvas(canvasId))
  }
}

export const deleteRangePoint = (rangeId, canvasId, {sourceId}) => async dispatch => {
  try {
		await fetch(makeUrl('api', `canvas/${canvasId}/point/${sourceId}`), {
      method: 'DELETE',
    })
  } finally {
    if (!!rangeId) {
      dispatch(getRangePoints(rangeId))
    }
    dispatch(getCanvas(canvasId))
  }
}

export const getCanvas = requiredId(canvasId => async dispatch => {
  const canvasDetail = await fetch(makeUrl('api', `canvas/${canvasId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['canvas'], itemOrItems: canvasDetail})
})

export const updateCanvas = buildUpdater(MODEL['canvas'], ['notes', 'exclude', 'hole', 'tags'], id => makeUrl('api', `canvas/${id}`), getCanvas)