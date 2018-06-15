import Immutable from 'immutable'
import React from 'react'

import connectHelper from '../connectHelper'
import * as iiifRedux from './redux'

export const picked = picked => Component => {
  const ownerPick = picked[0]
  const primaryPick = picked[picked.length - 1]
  let onItemPicked
  const mapDispatchToProps = {}
  switch (primaryPick) {
    case 'collection':
      mapDispatchToProps.onItemPicked = id => dispatch => {
        dispatch(iiifRedux.pick(primaryPick, id))
        dispatch(iiifRedux.pick('manifest', null))
        dispatch(iiifRedux.pick('range', null))
        dispatch(iiifRedux.pick('canvas', null))
        dispatch(iiifRedux.getCollection(id))
      }
      mapDispatchToProps.updateCollection = iiifRedux.updateCollection
      break
    case 'manifest':
      mapDispatchToProps.onItemPicked = id => dispatch => {
        dispatch(iiifRedux.pick(primaryPick, id))
        dispatch(iiifRedux.pick('range', null))
        dispatch(iiifRedux.pick('canvas', null))
        dispatch(iiifRedux.getManifest(id))
        dispatch(iiifRedux.getManifestStructures(id))
      }
      mapDispatchToProps.updateManifest = iiifRedux.updateManifest
      break
    case 'range':
      mapDispatchToProps.onItemPicked = id => dispatch => {
        dispatch(iiifRedux.pick(primaryPick, id))
        dispatch(iiifRedux.pick('canvas', null))
        dispatch(iiifRedux.getRange(id))
        dispatch(iiifRedux.getRangePoints(id))
      }
      mapDispatchToProps.updateRange = iiifRedux.updateRange
      break
    case 'canvas':
      mapDispatchToProps.onItemPicked = id => dispatch => {
        dispatch(iiifRedux.pick(primaryPick, id))
        //dispatch(iiifRedux.getCanvas(id))
      }
      mapDispatchToProps.updateCanvas = iiifRedux.updateCanvas
      mapDispatchToProps.setRangePoint = iiifRedux.setRangePoint
      mapDispatchToProps.deleteRangePoint = iiifRedux.deleteRangePoint
      break
  }
  switch (ownerPick) {
    case 'collection':
      mapDispatchToProps.updateOwner = iiifRedux.updateCollection
      break
    case 'manifest':
      mapDispatchToProps.updateOwner = iiifRedux.updateManifest
      break
    case 'range':
      mapDispatchToProps.updateOwner = iiifRedux.updateRange
      break
    case 'canvas':
      mapDispatchToProps.updateOwner = iiifRedux.updateCanvas
      break
  }

  function mapStateToProps(store, props) {
    const {iiif} = store
    return picked.reduce((result, type) => {
      const pickedId = iiif.getIn([iiifRedux.MODEL['picked'], type, 'value'])
      const pickedValue = result[type] = iiif.getIn([iiifRedux.MODEL[type], pickedId])
      if (pickedValue) {
        switch (type) {
          case 'collection':
            // .members
            result.manifests = pickedValue.get('manifests', Immutable.List()).map(id => iiif.getIn([iiifRedux.MODEL.manifest, id]))
            break
          case 'manifest':
            // .ranges
            // .rangesWithCanvases
            result.ranges = pickedValue.get('ranges', Immutable.List()).map(id => iiif.getIn([iiifRedux.MODEL.range, id]))
            result.rangesWithCanvases = pickedValue.get('rangesWithCanvases', Immutable.List()).map(id => iiif.getIn([iiifRedux.MODEL.range, id]))
            break
          case 'range':
            // .canvases
            // .points
            //console.log('rangeCanvases', rangeCanvases)
            result.points = iiif.getIn([iiifRedux.MODEL['range_points'], pickedId, 'points'])
            result.canvases = pickedValue.get('canvases', Immutable.List()).map(id => {
              return iiif.getIn([iiifRedux.MODEL.canvas, id])
            })
            break
        }
      }
      return result
    }, {})
  }
  return connectHelper({mapStateToProps, mapDispatchToProps})(Component)
}