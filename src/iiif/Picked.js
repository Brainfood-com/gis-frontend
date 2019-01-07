import flow from 'lodash-es/flow'
import React from 'react'

import connectHelper from '../connectHelper'
import * as iiifRedux from './redux'
import {immutableEmptyList, immutableEmptyMap} from '../constants'
import {BusyPane} from '../GlobalBusy'

function wrapWildcardImport(wildcardImport, name) {
  return (...args) => {
    return wildcardImport[name](...args)
  }
}

export const picked = picked => Component => {
  const ownerPick = picked[0]
  const primaryPick = picked[picked.length - 1]
  let onItemPicked
  const mapDispatchToProps = {}
  switch (primaryPick) {
    case 'collection':
      mapDispatchToProps.onItemPicked = id => (dispatch, getState) => dispatch(iiifRedux.pick(primaryPick, id))
      mapDispatchToProps.updateCollection = wrapWildcardImport(iiifRedux, 'updateCollection')
      break
    case 'manifest':
      mapDispatchToProps.onItemPicked = id => (dispatch, getState) => dispatch(iiifRedux.pick(primaryPick, id))
      mapDispatchToProps.updateManifest = wrapWildcardImport(iiifRedux, 'updateManifest')
      break
    case 'range':
      mapDispatchToProps.onItemPicked = id => (dispatch, getState) => dispatch(iiifRedux.pick(primaryPick, id))
      mapDispatchToProps.updateRange = wrapWildcardImport(iiifRedux, 'updateRange')
      break
    case 'canvas':
      mapDispatchToProps.onItemPicked = id => (dispatch, getState) => dispatch(iiifRedux.pick(primaryPick, id))
      mapDispatchToProps.updateCanvas = (id, data) => (dispatch, getState) => {
        dispatch(iiifRedux.updateCanvas(id, data)).then(() => {
          if (data.exclude !== undefined) {
            const rangeId = getState().iiif.getIn([iiifRedux.MODEL['picked'], 'range', 'value'])
            if (rangeId) {
              dispatch(iiifRedux.getRangePoints(rangeId))
            }
          }
        })
      }
      mapDispatchToProps.setRangePoint = wrapWildcardImport(iiifRedux, 'setRangePoint')
      mapDispatchToProps.deleteRangePoint = wrapWildcardImport(iiifRedux, 'deleteRangePoint')
      break
    case 'pickedBuilding':
      mapDispatchToProps.onItemPicked = id => (dispatch, getState) => dispatch(iiifRedux.pick(primaryPick, id))
      break
  }
  switch (ownerPick) {
    case 'collection':
      mapDispatchToProps.updateOwner = wrapWildcardImport(iiifRedux, 'updateCollection')
      break
    case 'manifest':
      mapDispatchToProps.updateOwner = wrapWildcardImport(iiifRedux, 'updateManifest')
      break
    case 'range':
      mapDispatchToProps.updateOwner = wrapWildcardImport(iiifRedux, 'updateRange')
      break
    case 'canvas':
      mapDispatchToProps.updateOwner = wrapWildcardImport(iiifRedux, 'updateCanvas')
      break
  }

  function mapStateToProps(store, props) {
    const {iiif} = store
    return picked.reduce((result, type) => {
      let modelType = type
      const pickedId = iiif.getIn([iiifRedux.MODEL['picked'], type, 'value'])
      if (type === 'pickedBuilding') {
        //debugger
      }
      switch (type) {
        case 'pickedBuilding':
          modelType = 'buildings'
          break
      }
      let busy = 0
      const owner = props[ownerPick]
      busy += owner ? owner.get('_busy', 0) : 0
      switch (type) {
        case 'root':
          result.collections = iiif.get(iiifRedux.MODEL['collection'])
          break
        case 'buildings':
          result.buildings = iiif.get(iiifRedux.MODEL['buildings'])
          break
        default:
          const pickedValue = result[type] = iiif.getIn([iiifRedux.MODEL[modelType], pickedId])
          busy += pickedValue ? pickedValue.get('_busy', 0) : 0
          if (pickedValue) {
            switch (type) {
              case 'collection':
                // .members
                result.manifests = pickedValue.get('manifests', immutableEmptyList).map(id => iiif.getIn([iiifRedux.MODEL.manifest, id]))
                break
              case 'manifest':
                // .ranges
                // .rangesWithCanvases
                result.ranges = pickedValue.get('ranges', immutableEmptyList).map(id => iiif.getIn([iiifRedux.MODEL.range, id]))
                result.rangesWithCanvases = pickedValue.get('rangesWithCanvases', immutableEmptyList).map(id => iiif.getIn([iiifRedux.MODEL.range, id]))
                break
              case 'range':
                // .canvases
                // .points
                //console.log('rangeCanvases', rangeCanvases)
                result.buildings = iiif.get(iiifRedux.MODEL['buildings'])
                result.points = iiif.getIn([iiifRedux.MODEL['range_points'], pickedId, 'points'])
                result.canvases = pickedValue.get('canvases', immutableEmptyList).map(id => {
                  return iiif.getIn([iiifRedux.MODEL.canvas, id])
                })
                if (pickedValue.get('reverse', false)) {
                  result.canvases = result.canvases.reverse()
                }
                break
              case 'pickedBuilding':
                const canvasesByRange = result.canvasesByRange = iiif.getIn([iiifRedux.MODEL['building_canvases'], pickedId, 'canvasesByRange'], immutableEmptyMap)
                result.rangesById = canvasesByRange.reduce((result, canvases, rangeId) => {
                  result[rangeId] = iiif.getIn([iiifRedux.MODEL.range, parseInt(rangeId)])
                  return result
                }, {})
                break
             }
          }
      }
      result.isBusy = busy > 0
      return result
    }, {})
  }
  return connectHelper({mapStateToProps, mapDispatchToProps})(class BusyWrapper extends React.Component {
    render() {
      const {isBusy, ...props} = this.props
      return <BusyPane isBusy={isBusy}><Component {...props}/></BusyPane>
    }
  })
}
