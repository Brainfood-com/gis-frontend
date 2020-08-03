import ReactGA from 'react-ga'
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
  map.set('status', immutableEmptyMap.withMutations(map => {
    map.set(MODEL['collection'], immutableEmptyMap)
    map.set(MODEL['manifest'], immutableEmptyMap)
    map.set(MODEL['range'], immutableEmptyMap)
    map.set(MODEL['range_points'], immutableEmptyMap)
    map.set(MODEL['canvas'], immutableEmptyMap)
    map.set(MODEL['buildings'], immutableEmptyMap)
  }))
})

export const defaultItemStatusValue = immutableEmptyMap.merge(fromJS({
  busy: 0,
  exists: false,
}))

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
  switch (actionType) {
    case ACTION.clear:
      return state
        .set(modelType, state.get(modelType).clear())
        .set('status', state.get('status').set(modelType, immutableEmptyMap))
      break
  }
  let itemHandler, statusHandler
  switch (actionType) {
    // brief types
    case ACTION.set:
      itemHandler = (currentValue, item) => {
        const immutableItem = fromJS(item)
        let newValue
        if (!currentValue) {
          return immutableItem
        } else {
          return currentValue.merge(immutableItem)
        }
      }
      break
    case ACTION.delete:
      itemHandler = (currentValue, item) => undefined
      statusHandler = (currentValue, item) => undefined
      break
    case ACTION.incrBusy:
      statusHandler = (currentItemStatus = defaultItemStatusValue, item) => {
        return currentItemStatus.set('busy', currentItemStatus.get('busy', 0) + 1)
      }
      break
    case ACTION.decrBusy:
      statusHandler = (currentItemStatus, item) => {
        return currentItemStatus.set('busy', currentItemStatus.get('busy') - 1)
      }
      break
  }
  const itemStateUpdater = (state, keyPath, itemHandler) => {
    if (!itemHandler) {
      return state
    }
    const loopHandler = (map, itemOrString) => {
      const id = typeof itemOrString === 'string' || typeof itemOrString === 'number' ? itemOrString : itemOrString.id
      if (id === undefined) {
        debugger
      }
      const currentValue = map.get(id)
      const newValue = itemHandler(currentValue, itemOrString)
      if (newValue === undefined) {
        return map.delete(id)
      } else {
        return map.set(id, newValue)
      }
    }
    const map = state.getIn(keyPath)
    const arrayHandler = map => {
      if (Array.isArray(itemOrItems)) {
        return map.withMutations(map => {
          itemOrItems.map(item => loopHandler(map, item))
        })
      } else {
        return loopHandler(map, itemOrItems)
      }
    }
    return state.setIn(keyPath, arrayHandler(state.getIn(keyPath)))
  }
  const stateWithUpdatedItems = itemStateUpdater(state, [modelType], itemHandler)

  switch (modelType) {
    case MODEL['picked']:
      const newPicked = stateWithUpdatedItems.get(modelType).reduce((result, value, key, newPicked) => {
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
  return itemStateUpdater(stateWithUpdatedItems, ['status', modelType], statusHandler)
}

const json = promise => promise.then(data => data.json())

export const pick = (type, id) => async (dispatch, getState) => {
  const toPick = {[type]: id}
  await dispatch(pickMany(toPick))
  dispatch(gaEvent(type, id))
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
      await dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['picked'], itemOrItems: {id: modelType, value: id}})
      outstandingFetchers.splice(-1, 0, ...modelTypeToFetchers[modelType].map(handler => handler(id)))
    } else if (needsUnset) {
      if (currentId !== undefined || currentId !== null) {
        await dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['picked'], itemOrItems: {id: modelType, value: null}})
        ReactGA.event({category: 'iiif-fetch-' + modelType, action: 'unset'})
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
        ReactGA.pageview(`/iiif?externalId=${encodeURIComponent(currentExternalId)}`)
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
  await dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['collection'], itemOrItems: collections.map(collectionBuildKey).map(collectionBuildLabel)})
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
  const {allParents} = typeInfo
  let {iiifTypeId} = typeInfo
  const toPick = {}
  for (const modelName of modelOrder) {
    const {[modelName]: [modelParentId] = []} = allParents
    if (modelParentId) {
      toPick[modelName] = modelParentId
      if (modelName === iiifTypeId) {
        iiifTypeId = null
      }
    } else if (iiifTypeId === null) {
      const {childId} = context
      if (childId) {
        toPick[modelName] = childId
      }
      break
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

const requiredId = chain => (id, ...rest) => !!id ? chain(id, ...rest) : async dispatch => {}
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

const busyCall = (modelName, chain) => (id, ...rest) => {
  return async (dispatch, getState) => {
    return busyCallWrapper(modelName, id, dispatch, () => chain(id, ...rest)(dispatch, getState))
  }
}

export const getBuilding = busyCall('buildings', id => async (dispatch, getState) => {
  if (id === null || id === undefined) {
    return
  }
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

function collectionBuildKey(collection) {
  const {externalId} = collection
  const clientKey = externalId.replace(/.*\/([^\/]+)\/collection\.json$/, '$1')
  if (clientKey !== externalId) {
    return {...collection, clientKey}
  } else {
    return collection
  }
}

function collectionBuildLabel(collection) {
  const {clientKey} = collection
  const _extra = []
  if (clientKey) {
    _extra.push({name: 'key', value: clientKey})
  }
  return {...collection, _extra}
}

export const getCollection = requiredId(busyCall('collection', (collectionId, {full = true} = {}) => async dispatch => {
  const collectionDetail = await fetch(makeUrl('api', `collection/${collectionId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['manifest'], itemOrItems: collectionDetail.manifests.map(manifestBuildKey).map(manifestBuildLabel)})
  collectionDetail.manifests = collectionDetail.manifests.map(manifest => manifest.id)
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['collection'], itemOrItems: collectionBuildLabel(collectionBuildKey(collectionDetail))})
  if (full) {
    collectionDetail.manifests.forEach(manifestId => dispatch(getManifest(manifestId)))
  }
}))

export const updateCollection = buildUpdater(MODEL['collection'], ['notes', 'tags', 'values'], id => makeUrl('api', `collection/${id}`), getCollection)

function manifestBuildKey(manifest) {
  const {externalId} = manifest
  const clientKey = externalId.replace(/.*\/([^\/]+)\/manifest\.json$/, '$1')
  if (clientKey !== externalId) {
    return {...manifest, clientKey}
  } else {
    return manifest
  }
}

function manifestBuildLabel(manifest) {
  const {clientKey, values = {}} = manifest
  const _extra = []
  if (clientKey) {
    _extra.push({name: 'key', value: clientKey})
  }
  if (values.batch !== undefined) {
    _extra.push({name: 'batch', value: values.batch})
  }
  if (values.year !== undefined) {
    _extra.push({name: 'year', value: values.year})
  }
  return {...manifest, _extra}
}

export const getManifest = requiredId(busyCall('manifest', manifestId => async dispatch => {
  const manifestDetail = await fetch(makeUrl('api', `manifest/${manifestId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['manifest'], itemOrItems: manifestBuildLabel(manifestBuildKey(manifestDetail))})
}))

export const updateManifest = buildUpdater(MODEL['manifest'], ['notes', 'tags', 'values'], id => makeUrl('api', `manifest/${id}`), getManifest)

export const getManifestStructures = requiredId(busyCall('manifest', manifestId => async dispatch => {
  const ranges = []
  const rangesWithCanvases = []
  const allCanvases = []
  const manifestStructures = (await fetch(makeUrl('api', `manifest/${manifestId}/structures`)).then(data => data.json())).map(rangeBuildKey).map(structure => {
    const {id, clientKey, manifestYear} = structure
    const canvases = structure.canvases || []
    if (structure.canvases) {
      if (structure.canvases.length) {
        rangesWithCanvases.push(id)
        allCanvases.splice(-1, 0, ...structure.canvases)
      }
    }
    ranges.push(id)
    const _extra = [
      {name: 'canvases', value: canvases.length},
      {name: 'points', value: structure.pointOverrideCount || 0},
    ]
    if (clientKey) {
      _extra.push({name: 'key', value: clientKey})
    }
    if (manifestYear) {
      _extra.push({name: 'year', value: manifestYear})
    }
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

function rangeBuildKey(range) {
  const {externalId} = range
  const clientKey = externalId.replace(/.*\/([^\/]+)\/range\/range-([0-9]+)\.json$/, '$1/$2')
  if (clientKey !== externalId) {
    return {...range, clientKey}
  } else {
    return range
  }
}

export const getRange = requiredId(busyCall('range', rangeId => async dispatch => {
  const rangeDetail = await fetch(makeUrl('api', `range/${rangeId}`)).then(data => data.json())
  //dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: rangeDetail.structures})
  //rangeDetail.ranges = rangeDetail.ranges.map(range => range.id)
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: rangeBuildKey(rangeDetail)})
}))

export const updateRange = buildUpdater(MODEL['range'], ['notes', 'reverse', 'fovAngle', 'fovDepth', 'fovOrientation', 'tags', 'values'], id => makeUrl('api', `range/${id}`), rangeId => dispatch => {
  dispatch(getRange(rangeId))
  dispatch(getRangePoints(rangeId))
  dispatch(getStats('range'))
  dispatch(searchRefreshBuildings({rangeId}))
})

const REGEXES = [
  /^http:\/\/(media.getty.edu\/iiif\/research\/archives\/[^\/]+?(?:_thumb)?)$/,
]
export const iiifLocalCache = service => {
  if (!service) {
    return service
  }
  for (const regex of REGEXES) {
    const match = service.match(regex)
    if (match) {
      return makeUrl('cantaloupe', 'iiif/2/' + match[1].replace(/\//g, '%2F'))
    }
  }
  return service
}
export const getRangePoints = requiredId(busyCall('range', rangeId => async (dispatch, getState) => {
  let pickedId = getState().iiif.getIn([MODEL['picked'], 'canvas', 'value'])

  const canvasPoints = await fetch(makeUrl('api', `range/${rangeId}/canvasPoints`)).then(data => data.json())

  const canvases = new Array(canvasPoints.length)
  const points = new Array()

  const wantedBuildings = {}
  canvasPoints.forEach((canvasPoint, index) => {
    const {id, format, height, image, thumbnail, width, external_id: externalId, label, overrides, point, buildings, notes, exclude, hole, googleVision, ...canvasPointRest} = canvasPoint
    canvases[index] = canvasBuildKey({
      id, format, height, width, externalId, label, overrides, notes, exclude, hole, googleVision,
      image: iiifLocalCache(image),
      thumbnail: thumbnail ? iiifLocalCache(thumbnail): null,
    })
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

  const pointsMap = immutableEmptyOrderedMap.withMutations(map => points.forEach(point => map.set(point.id, fromJS(point))))

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

function canvasBuildKey(canvas) {
  const {externalId} = canvas
  const clientKey = externalId.replace(/.*\/([^\/]+)\/canvas\/canvas-([a-zA-Z0-9]+)\.json$/, '$1/$2')
  if (clientKey !== externalId) {
    return {...canvas, clientKey}
  } else {
    return canvas
  }
}

export const getCanvas = requiredId(busyCall('canvas', canvasId => async dispatch => {
  const canvasDetail = await fetch(makeUrl('api', `canvas/${canvasId}`)).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['canvas'], itemOrItems: canvasBuildKey(canvasDetail)})
}))

export const updateCanvas = buildUpdater(MODEL['canvas'], ['notes', 'exclude', 'hole', 'tags', 'values'], id => makeUrl('api', `canvas/${id}`), id => async dispatch => {
  dispatch(getCanvas(id))
  const typeInfo = await fetch(makeUrl('api', 'iiif/detectType'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({iiifId: id}),
  }).then(data => data.json())
  const rangeIds = typeInfo.allParents['sc:Range'] || []
  rangeIds.forEach(rangeId => dispatch(searchRefreshBuildings({rangeId})))
})

const gaEvent = (modelType, id) => async (dispatch, getState) => {
  const externalId = getState().iiif.getIn([MODEL[modelType], id, 'externalId'])
  ReactGA.event({category: 'iiif-fetch-' + modelType, action: 'set', label: externalId})
}

const modelTypeToFetchers = {
  collection: [getCollection],
  manifest: [getManifest, getManifestStructures],
  range: [getRange, getRangePoints],
  canvas: [/*getCanvas*/],
  pickedBuilding: [/*getBuilding*/],
}
