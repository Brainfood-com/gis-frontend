import Enum from 'es6-enum'
import Immutable from 'immutable'

import GeometryUtil from 'leaflet-geometryutil'

import {makeUrl} from '../api'

const ACTION = Enum(
  'set',
  'delete',
  'clear',
)
export const MODEL = Enum(
  'sc:Collection',
  'sc:Manifest',
  'sc:Range',
  'sc:Range_points',
  'sc:Canvas',

  'picked',
)

const defaultState = Immutable.Map().withMutations(map => {
  map.set(MODEL['sc:Collection'], Immutable.OrderedMap())
  map.set(MODEL['sc:Manifest'], Immutable.OrderedMap())
  map.set(MODEL['sc:Range'], Immutable.OrderedMap())
  map.set(MODEL['sc:Range_points'], Immutable.OrderedMap())
  map.set(MODEL['sc:Canvas'], Immutable.OrderedMap())
  map.set(MODEL['picked'], Immutable.Map().withMutations(map => {
    const picked = JSON.parse(localStorage.getItem('gis-app.picked')) || {}
    Object.keys(picked).forEach(key => {
      const {[key]: value} = picked
      if (value) {
        map.set(key, Immutable.Map({value}))
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
        if (!currentValue || currentValue.get('type') !== item.type) {
          return map.set(id, Immutable.Map(item))
        } else {
          return map.set(id, currentValue.merge(item))
        }
      }
      break
    case ACTION.delete:
      itemHandler = (map, id) => map.delete(id)
      break
  }
  if (Array.isArray(itemOrItems)) {
    const singletonHandler = itemHandler
    itemHandler = (map, items) => map.withMutations(map => items.map(item => singletonHandler(map, item)))
  }
  const newModelValue = itemHandler(existingModelValue, itemOrItems)
  switch (modelType) {
    case MODEL['picked']:
      const newPicked = newModelValue.toJSON()
      console.log('newPicked', newPicked)
      break
  }
  console.log('reducer', actionType, modelType, newModelValue.toJSON())
  return state.set(modelType, newModelValue)
}

const json = promise => promise.then(data => data.json())

export const pick = (type, id) => async (dispatch, getState) => {
  if (!!id) {
    return {type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['picked'], itemOrItems: {id: type, value: id}}
  } else {
    return {type: 'redux-iiif', actionType: ACTION.delete, modelType: MODEL['picked'], itemOrItems: {id: type}}
  }
}

export const startOfDay = () => async dispatch => {
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['sc:Collection']})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['sc:Manifest']})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['sc:Range']})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['sc:Range_points']})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['sc:Canvas']})
  const collections = await fetch(makeUrl('api', 'collection')).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Collection'], itemOrItems: collections})
}

const requiredId = chain => id => !!id ? chain(id) : dispatch => {}

export const getCollection = requiredId(collectionId => async dispatch => {
  console.log('------ getCollection', collectionId)
  const collectionDetail = await fetch(makeUrl('api', `collection/${collectionId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Manifest'], itemOrItems: collectionDetail.members})
  collectionDetail.members = collectionDetail.members.map(member => member.id)
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Collection'], itemOrItems: collectionDetail})
})

export const getManifest = requiredId(manifestId => async dispatch => {
  const manifestDetail = await fetch(makeUrl('api', `manifest/${manifestId}`)).then(data => data.json())
  const manifestStructures = await fetch(makeUrl('api', `manifest/${manifestId}/structures`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Range'], itemOrItems: manifestStructures})
  const ranges = []
  const rangesWithCanvases = []
  manifestStructures.forEach(structure => {
    const {id} = structure
    if (structure.canvases) {
      structure.label += `(${structure.canvases.length})`
      if (structure.canvases.length) {
        rangesWithCanvases.push(id)
      }
    }
    if (structure.pointOverrideCount) {
      structure.label += `(p=${structure.pointOverrideCount})`
    }
    ranges.push(id)
  })
  manifestDetail.ranges = ranges
  manifestDetail.rangesWithCanvases = rangesWithCanvases
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Manifest'], itemOrItems: manifestDetail})
})

export const getRange = requiredId(rangeId => async dispatch => {
  const rangeDetail = await fetch(makeUrl('api', `range/${rangeId}`)).then(data => data.json())
  //dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Range'], itemOrItems: rangeDetail.structures})
  //rangeDetail.ranges = rangeDetail.ranges.map(range => range.id)
  console.log('rangeDetail', rangeDetail)
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Range'], itemOrItems: rangeDetail})
})

export const updateRange = (rangeId, {notes, fovAngle, fovDepth, fovOrientation, tags}) => async (dispatch, getState) => {
  try {
    const type = getState().iiif.getIn([MODEL['sc:Range'], rangeId, 'type'])
    dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Range'], itemOrItems: {type, notes, fovAngle, fovDepth, fovOrientation, tags}})
		await fetch(makeUrl('api', `range/${rangeId}`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        notes,
        fovAngle,
        fovDepth,
        fovOrientation,
        tags,
      }),
    })
  } finally {
    dispatch(getRange(rangeId))
  }
}

export const getCanvas = requiredId(canvasId => async dispatch => {
  const canvasDetail = await fetch(makeUrl('api', `canvas/${canvasId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Canvas'], itemOrItems: canvasDetail})
})

export const getRangePoints = rangeId => async dispatch => {
  const canvasPoints = await fetch(makeUrl('api', `range/${rangeId}/canvasPoints`)).then(data => data.json())

  const canvases = new Array(canvasPoints.length)
  const bearingPoints = new Array(2)
  canvasPoints.forEach((canvasPoint, index) => {
    const {id, format, height, image, thumbnail, width, external_id: externalId, label, overrides, point, ...canvasPointRest} = canvasPoint
    canvases[index] = {id, format, height, image, thumbnail, width, externalId, label, overrides}
    points[index] = {id, point, ...canvasPointRest}

    bearingPoints[1] = {
      lat: point.coordinates[1],
      lng: point.coordinates[0],
    }
    if (i > 0) {
      points[index - 1].bearing = GeometryUtil.bearing(...bearingPoints)
    }
    bearingPoints[0] = bearingPoints[1]
  })
  points[points.length - 1].bearing = points[points.length - 2]

  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Canvas'], itemOrItems: canvases})
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['sc:Range_points'], itemOrItems: points})
}

export const setCanvasPoint = (rangeId, canvasId, {sourceId, priority, notes, point}) => async dispatch => {
  try {
		await fetch(makeUrl('api', `canvas/${canvasId}/point/${sourceId}`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        priority,
        notes,
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
