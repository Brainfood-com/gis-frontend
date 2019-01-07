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
    const selected = canvas ? canvas.get('id') : null
    const {camera, buildings: pointBuildings} = canvas && points.get(selected) || {}
    const notNullCanvases = canvases.filter(canvas => canvas && points.get(canvas.get('id')))

//    const {bearing, point, camera} = rangePoint
//      { selected && camera ? <GISGeoJSON data={camera}/> : null }
//      { selected && buildings ? buildings.map(building => <GISGeoJSON key={building.id} data={building.geojson}/>) : null }

    return <FeatureGroup>
      { camera ? <GISGeoJSON pane='tilePane' data={camera}/> : null }
      { pointBuildings && pointBuildings.map(id => {
        const building = buildings.get(id)
        return <Building key={id} building={building}/>
      }) }
      {notNullCanvases.map((canvas, index) => {
        const id = canvas.get('id')
        const rangePoint = points.get(id)
        const isFirst = index === 0
        const isLast = index === notNullCanvases.length - 1
        return <DraggableCanvasPosition key={id} zoom={zoom} range={range} canvas={canvas} rangePoint={rangePoint} onUpdatePoint={this.handleOnUpdatePoint} onCanvasSelect={onItemPicked} selected={selected === id} fovOrientation={fovOrientation} isFirst={isFirst} isLast={isLast} />

      })}
    </FeatureGroup>
  }
})
