import Enum from 'es6-enum'
import {fromJS} from 'immutable'

import GeometryUtil from 'leaflet-geometryutil'

import history from '../history'
import {decrBusy as globalDecrBusy, incrBusy as globalIncrBusy} from '../application-redux'
import {makeUrl} from '../api'
import {immutableEmptyMap, immutableEmptyOrderedMap} from '../constants'
import {getStats} from './stats'
import { refreshBuildings as searchRefreshBuildings } from '../GISSearch'

export const ACTION = Enum(
  'set',
  'delete',
  'clear',
  'incrBusy',
  'decrBusy',
)
const modelOrder = ['sc:Collection', 'sc:Manifest', 'sc:Range', 'sc:Canvas']
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

  'buildings',
  'building_canvases',
  'range_points',
  'picked',
  'stats',
)

const defaultState = immutableEmptyMap.withMutations(map => {
  map.set(MODEL['collection'], immutableEmptyOrderedMap)
  map.set(MODEL['manifest'], immutableEmptyOrderedMap)
  map.set(MODEL['range'], immutableEmptyOrderedMap)
  map.set(MODEL['range_points'], immutableEmptyOrderedMap)
  map.set(MODEL['canvas'], immutableEmptyOrderedMap)
  map.set(MODEL['buildings'], immutableEmptyOrderedMap)
  map.set(MODEL['building_canvases'], immutableEmptyMap)
  map.set(MODEL['picked'], immutableEmptyMap)
  map.set(MODEL['stats'], immutableEmptyMap.withMutations(map => {
    map.set('range', immutableEmptyMap)
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
        const immutableItem = fromJS(item).delete('_busy')
        let newValue
        if (!currentValue) {
          newValue = immutableItem
        } else {
          newValue = currentValue.merge(immutableItem)
        }
        return map.set(id, newValue)
      }
      break
    case ACTION.delete:
      itemHandler = (map, item) => map.delete(item.id)
      break
    case ACTION.incrBusy:
      itemHandler = (map, id) => {
        const currentValue = map.get(id)
        if (!currentValue) {
          return map.set(id, fromJS({_busy: 1}))
        } else {
          return map.set(id, currentValue.set('_busy', (currentValue.get('_busy') || 0) + 1))
        }
      }
      break
    case ACTION.decrBusy:
      itemHandler = (map, id) => {
        const currentValue = map.get(id)
        if (!currentValue) {
          return map
        }
        const busy = currentValue.get('_busy')
        if (busy && busy > 1) {
          return map.set(id, currentValue.set('_busy', busy - 1))
        }
        return map.set(id, currentValue.delete('_busy'))
      }
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
  const toPick = {[type]: id}
  return pickMany(toPick)
}

export const pickMany = toPick => async (dispatch, getState) => {
  function getModelId(modelType) {
    return getState().iiif.getIn([MODEL['picked'], modelType, 'value'])
  }
  const toPickMapped = Object.entries(toPick).reduce((toPick, [key, value]) => {
    toPick[iiifTypeToModelType[key] || key] = value
    return toPick
  }, {})
  const modelTypeValues = modelOrder.map(modelName => {
    const modelType = iiifTypeToModelType[modelName]
    return {modelType, id: toPickMapped[modelType]}
  })
  modelTypeValues.reduce((needsUnset, modelTypeValue) => {
    const {id} = modelTypeValue
    if (id !== undefined) {
      if (id === null) {
        modelTypeValue.needsUnset = true
      }
      return true
    } else if (needsUnset) {
      modelTypeValue.needsUnset = true
      return true
    } else {
      return needsUnset
    }
  }, false)
  function getExternalId(canvasId) {
    return getState().iiif.getIn([MODEL['canvas'], canvasId, 'externalId'])
  }
  const existingCanvasId = getModelId('canvas')
  const existingExternalId = getExternalId(existingCanvasId)
  const outstandingFetchers = []
  for (const {modelType, needsUnset, id} of modelTypeValues) {
    const currentId = getModelId(modelType)
    if (!!id) {
      if (typeof id !== 'number') {
        debugger
      }
      if (id === currentId) {
        continue
      }
      console.log('pick/dispatch:set', modelType, id)
      await dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['picked'], itemOrItems: {id: modelType, value: id}})
      outstandingFetchers.splice(-1, 0, ...modelTypeToFetchers[modelType].map(handler => handler(id)))
    } else if (needsUnset) {
      console.log('pick/dispatch:delete', modelType, currentId)
      if (currentId !== undefined || currentId !== null) {
        await dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['picked'], itemOrItems: {id: modelType, value: null}})
      }
      // TODO: unset items from redux
    }
  }
  const pickedCanvasId = getModelId('canvas')
  await Promise.all(outstandingFetchers.map(dispatch))
  const currentCanvasId = getModelId('canvas')
  // check if we have been asked to change the canvas, and then make
  // certain nothing else has changed it in the interim
  if (existingCanvasId !== pickedCanvasId && pickedCanvasId === currentCanvasId) {
    const currentExternalId = getExternalId(currentCanvasId)
    if (existingExternalId !== currentExternalId) {
      if (currentExternalId) {
        history.replace(`/iiif?externalId=${encodeURIComponent(currentExternalId)}`)
      } else {
        history.replace('/')
      }
    }
  }
}

export const startOfDay = () => async (dispatch, getState) => {
  await Promise.all([
    dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['collection']}),
    dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['manifest']}),
    dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['range']}),
    dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['range_points']}),
    dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['canvas']}),
    dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL['buildings']}),
  ])
  const collections = await fetch(makeUrl('api', 'collection')).then(data => data.json())
  await dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['collection'], itemOrItems: collections})
  const picked = JSON.parse(localStorage.getItem('gis-app.picked')) || {}
  await dispatch(pickMany(picked))
  await dispatch(getStats('range'))
}

export const detectAndPick = context => async (dispatch, getState) => {
  const {iiifId, externalId} = context
  const typeInfo = await fetch(makeUrl('api', 'iiif/detectType'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({iiifId, externalId}),
  }).then(data => data.json())
  const {allParents, iiifTypeId} = typeInfo
  const toPick = {}
  for (const modelName of modelOrder) {
    const {[modelName]: [modelParentId] = []} = allParents
    if (modelParentId) {
      toPick[modelName] = modelParentId
      if (modelName === iiifTypeId) {
        break
      }
    } else {
      break
    }
  }
  await dispatch(pickMany(toPick))
}

const buildUpdater = (model, keys, urlBuilder, getModel) => (id, data) => async (dispatch, getState) => {
  try {
    const object = getState().iiif.getIn([model, id])
    const dataToSend = keys.reduce((result, key) => {
      const newValue = data[key]
      if (newValue !== undefined) {
        result[key] = newValue
      } else {
        const existingValue = object.get(key)
        if (existingValue !== undefined) {
          result[key] = existingValue
        }
      }
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

const requiredId = chain => id => !!id ? chain(id) : async dispatch => {}
async function busyCallWrapper(modelName, id, dispatch, next) {
  dispatch(globalIncrBusy())
  dispatch({type: 'redux-iiif', actionType: ACTION.incrBusy, modelType: MODEL[modelName], itemOrItems: id})
  try {
    return await next()
  } finally {
    dispatch(globalDecrBusy())
    dispatch({type: 'redux-iiif', actionType: ACTION.decrBusy, modelType: MODEL[modelName], itemOrItems: id})
  }
}

const busyCall = (modelName, chain) => id => {
  return async (dispatch, getState) => {
    return busyCallWrapper(modelName, id, dispatch, () => chain(id)(dispatch, getState))
  }
}

export const getBuilding = busyCall('buildings', id => async (dispatch, getState) => {
  if (id === null || id === undefined) {
    return
  }
  console.log('getBuilding', id)
  dispatch(ensureBuildings([id]))
  const apiUrl = new URL(makeUrl('api', `buildings/${id}/canvases`))
  const buildingCanvasesResults = await fetch(apiUrl).then(data => data.json())

  const canvasesByRange = buildingCanvasesResults.reduce((result, canvas) => {
    const {range_id: rangeId} = canvas
    const rangeCanvases = result[rangeId] || (result[rangeId] = [])
    rangeCanvases.push(canvas)
    return result
  }, {})
  Object.keys(canvasesByRange).forEach(rangeId => dispatch(getRange(parseInt(rangeId))))
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['building_canvases'], itemOrItems: {id, canvasesByRange: canvasesByRange}})
})

export const ensureBuildings = busyCall('buildings', ogcFids => async (dispatch, getState) => {
  const buildings = getState().iiif.get(MODEL['buildings'])
  const wantedOgcFids = ogcFids.filter(ogcFid => buildings.get(ogcFid))
  const apiUrl = new URL(makeUrl('api', `buildings`))
  wantedOgcFids.forEach(ogcFid => apiUrl.searchParams.append('id', ogcFid))
  const buildingResults = await fetch(apiUrl).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['buildings'], itemOrItems: buildingResults})
})

export const getCollection = requiredId(busyCall('collection', collectionId => async dispatch => {
  const collectionDetail = await fetch(makeUrl('api', `collection/${collectionId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['manifest'], itemOrItems: collectionDetail.manifests.map(manifestBuildLabel)})
  collectionDetail.manifests = collectionDetail.manifests.map(manifest => manifest.id)
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['collection'], itemOrItems: collectionDetail})
}))

export const updateCollection = buildUpdater(MODEL['collection'], ['notes', 'tags'], id => makeUrl('api', `collection/${id}`), getCollection)

function manifestBuildLabel(manifest) {
  const {tags = [], label, ...rest} = manifest
  const tagFlags = []
  if (tags.find(tag => tag === 'Claimed')) {
    tagFlags.push('Claimed')
  }
  return {...rest, label: `${label}(${tagFlags.join('/')})`, tags}
}

export const getManifest = requiredId(busyCall('manifest', manifestId => async dispatch => {
  const manifestDetail = await fetch(makeUrl('api', `manifest/${manifestId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['manifest'], itemOrItems: manifestBuildLabel(manifestDetail)})
}))

export const updateManifest = buildUpdater(MODEL['manifest'], ['notes', 'tags'], id => makeUrl('api', `manifest/${id}`), getManifest)

export const getManifestStructures = requiredId(busyCall('manifest', manifestId => async dispatch => {
  const ranges = []
  const rangesWithCanvases = []
  const allCanvases = []
  const manifestStructures = (await fetch(makeUrl('api', `manifest/${manifestId}/structures`)).then(data => data.json())).map(structure => {
    const {id} = structure
    const canvases = structure.canvases || []
    if (structure.canvases) {
      structure.label += `(${structure.canvases.length})`
      if (structure.canvases.length) {
        rangesWithCanvases.push(id)
        allCanvases.splice(-1, 0, structure.canvases)
      }
    }
    if (structure.pointOverrideCount) {
      structure.label += `(p=${structure.pointOverrideCount})`
    }
    ranges.push(id)
    const _extra = [
      {name: 'canvases', value: canvases.length},
      {name: 'points', value: structure.pointOverrideCount || 0},
    ]
    return {...structure, canvases: canvases.map(item => item.id), _extra}
  })
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: manifestStructures})
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['canvas'], itemOrItems: allCanvases})
  const manifestDetail = {
    id: manifestId,
    ranges,
    rangesWithCanvases,
  }
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['manifest'], itemOrItems: manifestDetail})
}))

export const getRange = requiredId(busyCall('range', rangeId => async dispatch => {
  const rangeDetail = await fetch(makeUrl('api', `range/${rangeId}`)).then(data => data.json())
  //dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: rangeDetail.structures})
  //rangeDetail.ranges = rangeDetail.ranges.map(range => range.id)
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: rangeDetail})
}))

export const updateRange = buildUpdater(MODEL['range'], ['notes', 'reverse', 'fovAngle', 'fovDepth', 'fovOrientation', 'tags'], id => makeUrl('api', `range/${id}`), rangeId => dispatch => {
  dispatch(getRange(rangeId))
  dispatch(getRangePoints(rangeId))
  dispatch(getStats('range'))
  dispatch(searchRefreshBuildings({rangeId}))
})

const REGEXES = [
  /^http:\/\/(media.getty.edu\/iiif\/research\/archives\/[^\/]+?(?:_thumb)?)$/,
]
export const getRangePoints = requiredId(busyCall('range', rangeId => async (dispatch, getState) => {
  let pickedId = getState().iiif.getIn([MODEL['picked'], 'canvas', 'value'])

  const canvasPoints = await fetch(makeUrl('api', `range/${rangeId}/canvasPoints`)).then(data => data.json())

  const canvases = new Array(canvasPoints.length)
  const points = new Array()
  const iiifLocalCache = service => {
    for (const regex of REGEXES) {
      const match = service.match(regex)
      if (match) {
        return makeUrl('cantaloupe', 'iiif/2/' + match[1].replace(/\//g, '%2F'))
      }
    }
    return service
  }

  const wantedBuildings = {}
  canvasPoints.forEach((canvasPoint, index) => {
    const {id, format, height, image, thumbnail, width, external_id: externalId, label, overrides, point, buildings, notes, exclude, hole, ...canvasPointRest} = canvasPoint
    canvases[index] = {
      id, format, height, width, externalId, label, overrides, notes, exclude, hole,
      image: iiifLocalCache(image),
      thumbnail: iiifLocalCache(thumbnail),
    }
    if (point) {
      const latlng = {
        lat: point.coordinates[1],
        lng: point.coordinates[0],
      }
      points.push({id, point, buildings, latlng, ...canvasPointRest})
    }
    if (buildings) {
      buildings.forEach(id => wantedBuildings[id] = true)
    }
  })
  const buildingIds = Object.keys(wantedBuildings)
  if (buildingIds) {
    dispatch(ensureBuildings(buildingIds))
  }

  const pointsMap = immutableEmptyOrderedMap.withMutations(map => points.forEach(point => map.set(point.id, point)))

  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: {id: rangeId, canvases: canvases.map(canvas => canvas.id)}})
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['canvas'], itemOrItems: canvases})
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range_points'], itemOrItems: {id: rangeId, points: pointsMap}})
  if (!!pickedId && !canvasPoints.find(canvasPoint => pickedId === canvasPoint.id)) {
    pickedId = null
  }
  if (!!!pickedId && canvases.length) {
    dispatch(pick('canvas', canvases[0].id))
  }
}))

export const setRangePoint = (rangeId, canvasId, {sourceId, priority, point}) => dispatch => busyCallWrapper('canvas', canvasId, dispatch, async () => {
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
    dispatch(searchRefreshBuildings({rangeId}))
  }
})

export const deleteRangePoint = (rangeId, canvasId, {sourceId}) => dispatch => busyCallWrapper('canvas', canvasId, dispatch, async () => {
  try {
		await fetch(makeUrl('api', `canvas/${canvasId}/point/${sourceId}`), {
      method: 'DELETE',
    })
  } finally {
    if (!!rangeId) {
      dispatch(getRangePoints(rangeId))
    }
    dispatch(getCanvas(canvasId))
    dispatch(searchRefreshBuildings({rangeId}))
  }
})

export const getCanvas = requiredId(busyCall('canvas', canvasId => async dispatch => {
  const canvasDetail = await fetch(makeUrl('api', `canvas/${canvasId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['canvas'], itemOrItems: canvasDetail})
}))

export const updateCanvas = buildUpdater(MODEL['canvas'], ['notes', 'exclude', 'hole', 'tags'], id => makeUrl('api', `canvas/${id}`), id => dispatch => {
  dispatch(getCanvas(id))
  dispatch(searchRefreshBuildings())
})

const modelTypeToFetchers = {
  collection: [getCollection],
  manifest: [getManifest, getManifestStructures],
  range: [getRange, getRangePoints],
  canvas: [/*getCanvas*/],
  pickedBuilding: [/*getBuilding*/],
}
