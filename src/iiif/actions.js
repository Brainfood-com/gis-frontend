import Enum from 'es6-enum'
import Immutable from 'immutable'

import GeometryUtil from 'leaflet-geometryutil'

import {makeUrl} from '../api'

const ACTION = Enum(
  'update',
  'set',
  'delete',
  'clear',
)
const MODEL = Enum(
  'collection',
  'manifest',
  'structure',
  'structure_points',
  'canvas',
)

const defaultState = Immutable.Map().withMutations(map => {
  map.set(MODEL.collection, Immutable.OrderedMap())
  map.set(MODEL.manifest, Immutable.OrderedMap())
  map.set(MODEL.structure, Immutable.OrderedMap())
  map.set(MODEL.structure_points, Immutable.OrderedMap())
  map.set(MODEL.canvas, Immutable.OrderedMap())
})

/*
  CollectionList: [<CollectionBrief>]
  CollectionBrief: {
    id<Number>,
    label<String>,
    type<String>,
  }
  Collection<CollectionBrief>: {
    *externalId<String>,
    id<Number>,
    label<String>,
    members: [<MemberBrief>],
    type<String>,
  }
  MemberBrief: {
    id<Number>,
    label<String>,
    type<String>,
  }
  Manifest<MemberBrief>: {
    attribution<String>,
    description<String>,
    *externalId<String>,
    id<Number>,
    label<String>,
    license<String>,
    logo<String>,
    structures: [<StructureBrief>],
    type<String>,
    viewingHint<String>,
  }
  StructureBrief: {
    id<Number>,
    label<String>,
    pointOverrideCount<Number>,
    type<String>,
    viewingHint,
  }
  Range<StructureBrief>: {
    canvases: [<String>],
    *externalId<String>,
    id<Number>,
    label<String>,
    pointOverrideCount,
    ranges: [<StructureBrief>],
    type<String>,
    viewingHint,
  }
  RangePoints: {
    id<String>, // -> Range
    points: [<RangePoint>],
  }
  RangePoint: {

  }
  Canvas: {
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
      return state.set(modelType, state.get(modelType).clear())
      break
  }
  let itemHandler
  switch (actionType) {
    case ACTION.update:
    case ACTION.set:
      itemHandler = (map, item) => map.set(item.key, item)
      break
    case ACTION.delete:
      itemHandler = (map, key) => map.delete(key)
      break
  }
  if (Array.isArray(itemOrItems)) {
    const singletonHandler = itemHandler
    itemHandler = (map, items) => map.withMutations(map => items.map(item => singletonHandler(map, item)))
  }
  return state.set(modelType, itemHandler(state.get(modelType), itemOrItems))
}

const json = promise => promise.then(data => data.json())

export const startOfDay = () => async dispatch => {
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL.collection})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL.manifest})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL.structure})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL.structure_points})
  dispatch({type: 'redux-iiif', actionType: ACTION.clear, modelType: MODEL.canvas})
  const collections = await fetch(makeUrl('api', 'collection')).then(data => data.json())
  collections.map(collection => {
    dispatch(getCollection(collection))
  })
}

export const getCollection = collection => async dispatch => {
  const {id: collectionId} = collection
  const collectionDetail = await fetch(makeUrl('api', `collection/${collectionId}`)).then(data => data.json())
  collectionDetail.key = collectionDetail.id
  dispatch({type: 'redux-iiif', actionType: ACTION.update, modelType: MODEL.collection, itemOrItems: collectionDetail})
}

export const getManifest = manifest => async dispatch => {
  const {id: manifestId} = manifest
  const manifestDetail = await fetch(makeUrl('api', `manifest/${manifestId}`)).then(data => data.json())
  manifestDetail.structures.forEach(structure => {
    if (structure.canvases) {
      structure.label += `(${structure.canvases.length})`
    }
    if (structure.pointOverrideCount) {
      structure.label += `(p=${structure.pointOverrideCount})`
    }
  })
  manifestDetail.structuresWithCanvases = manifestDetail.structures.filter(structure => structure.canvases && structure.canvases.length)
  manifestDetail.key = manifestDetail.id
  dispatch({type: 'redux-iiif', actionType: ACTION.update, modelType: MODEL.manifest, itemOrItems: manifestDetail})
}

export const getStructure = (manifest, structure) => async dispatch => {
  const {id: manifestId} = manifest
  const {id: structureId} = structure
  const structureDetail = fetch(makeUrl('api', `manifest/${manifestId}/range/${structureId}`)).then(data => data.json())
  structureDetail.key = [manifestId, structureId]
  dispatch({type: 'redux-iiif', actionType: ACTION.update, modelType: MODEL.structure, itemOrItems: structureDetail})
}

export const getCanvas = (manifest, canvas) => {
  const {id: manifestId} = manifest
  const {id: canvasId} = canvas
  const canvasDetail = fetch(makeUrl('api', `manifest/${manifestId}/canvas/${canvasId}`)).then(data => data.json())
  canvasDetail.key = [manifestId, canvasId]
  dispatch({type: 'redux-iiif', actionType: ACTION.update, modelType: MODEL.canvas, itemOrItems: canvasDetail})
}

export const getStructurePoints = (manifest, structure) => async dispatch => {
  const {id: manifestId} = manifest
  const {id: structureId} = structure
  const canvasPoints = fetch(makeUrl('api', `manifest/${manifestId}/range/${structureId}/canvasPoints`)).then(data => data.json())

  const canvases = new Array(canvasPoints.length)
  const bearingPoints = new Array(2)
  canvasPoints.forEach((canvasPoint, index) => {
    const {id, format, height, image, thumbnail, width, external_id, label, overrides, point, ...canvasPointRest} = canvasPoint
    canvases[index] = {key: [manfiestId, id], id, format, height, image, thumbnail, width, external_id, label, overrides}
    points[index] = {key: [manifestId, structureId, id], id, point, ...canvasPointRest}

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

  dispatch({type: 'redux-iiif', actionType: ACTION.update, modelType: MODEL.canvas, itemOrItems: canvases})
  dispatch({type: 'redux-iiif', actionType: ACTION.update, modelType: MODEL.structure_points, itemOrItems: points})
}
