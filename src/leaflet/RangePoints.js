import React from 'react'

import { FeatureGroup, GeoJSON, Popup } from 'react-leaflet'
import { picked } from '../iiif/Picked'
import DraggableCanvasPosition from './DraggableCanvasPosition'
import GISGeoJSON from '../GISGeoJSON'
import {immutableEmptyMap} from '../constants'

const Building = picked(['pickedBuilding'])(class Building extends React.Component {
  handleOnPopupOpen = () => {
    const {building, onItemPicked} = this.props
    onItemPicked(building.get('id'))
  }

  handleOnPopupClose = () => {
    const {building, onItemPicked} = this.props
    onItemPicked(null)
  }

  render() {
    const {building} = this.props
    if (!building) {
      return null
    }
    const geojson = building.get('geojson').toJS()
    const taxdata = building.get('taxdata', immutableEmptyMap)
    return <GeoJSON data={geojson}>
      <Popup onOpen={this.handleOnPopupOpen} onClose={this.handleOnPopupClose}>
        <div>
          <div>Roll Year: {taxdata && taxdata.get('roll_year')}</div>
          <div>Total Value: {taxdata && taxdata.get('total_value')}</div>
          <div>Net Taxable Value: {taxdata && taxdata.get('net_taxable_value')}</div>
        </div>
      </Popup>
    </GeoJSON>
  }
})

export default picked(['range', 'canvas'])(class RangePoints extends React.Component {
  handleOnUpdatePoint = (canvas, point) => {
    const {range, setRangePoint} = this.props
    const rangeId = range.get('id')
    const canvasId = canvas.get('id')
    setRangePoint(rangeId, canvasId, {sourceId: 'web', priority: 1, point})
  }

  render() {
    const {zoom, range, buildings, points, canvases, canvas, onItemPicked} = this.props
    if (!range || !points || !canvases) return <div/>
    const fovOrientation = range.get('fovOrientation', 'left')
    const selectedCanvasId = canvas ? canvas.get('id') : undefined
    const selectedPoint = canvas && points.get(selectedCanvasId) || immutableEmptyMap
    const camera = selectedPoint.get('camera')
    const pointBuildings = selectedPoint.get('buildings')
    const notNullCanvases = range.get('canvases').filter(canvasId => canvasId && points.get(canvasId))

//    const {bearing, point, camera} = rangePoint
//      { selectedCanvasId && camera ? <GISGeoJSON data={camera}/> : null }
//      { selectedCanvasId && buildings ? buildings.map(building => <GISGeoJSON key={building.id} data={building.geojson}/>) : null }

    return <FeatureGroup>
      { camera ? <GISGeoJSON pane='tilePane' data={camera}/> : null }
      { pointBuildings && pointBuildings.map(id => {
        const building = buildings.get(id)
        return <Building key={id} building={building}/>
      }) }
      {notNullCanvases.map((canvasId, index) => {
        const canvas = canvases.get(canvasId)
        const rangePoint = points.get(canvasId)
        const isFirst = index === 0
        const isLast = index === notNullCanvases.size - 1
        return <DraggableCanvasPosition key={canvasId} zoom={zoom} range={range} canvas={canvas} rangePoint={rangePoint} onUpdatePoint={this.handleOnUpdatePoint} onCanvasSelect={onItemPicked} selected={selectedCanvasId === canvasId} fovOrientation={fovOrientation} isFirst={isFirst} isLast={isLast} />

      })}
    </FeatureGroup>
  }
})
