import React from 'react'

import { FeatureGroup } from 'react-leaflet'
import { picked } from '../iiif/Picked'
import DraggableCanvasPosition from './DraggableCanvasPosition'

export default picked(['range', 'canvas'])(class RangePoints extends React.Component {
  onUpdatePoint = (canvas, point) => {
    const {range, setRangePoint} = this.props
    const rangeId = range.get('id')
    const canvasId = canvas.get('id')
    setRangePoint(rangeId, canvasId, {sourceId: 'web', priority: 1, point})
  }

  render() {
    const {allPoints, zoom, range, buildings, points, canvases, canvas, onItemPicked} = this.props
    if (!range || !points || !canvases) return <div/>
    const fovOrientation = range.get('fovOrientation', 'left')
    const selected = canvas ? canvas.get('id') : null
    const notNullCanvases = canvases.filter(canvas => canvas && points.get(canvas.get('id')))
    return <FeatureGroup>
      {notNullCanvases.map((canvas, index) => {
        const id = canvas.get('id')
        const rangePoint = points.get(id)
        const pointBuildings = buildings ? (rangePoint.buildings || []).map(id => {
          const building = buildings.get(id)
          return building ? building.toJS() : null
        }).filter(building => building) : []
        const isFirst = index === 0
        const isLast = index === notNullCanvases.length - 1
        //console.log('canvasBuildings', pointBuildings)
        return <DraggableCanvasPosition key={id} zoom={zoom} buildings={pointBuildings} canvas={canvas} rangePoint={rangePoint} allPoints={allPoints} onUpdatePoint={this.onUpdatePoint} onCanvasSelect={onItemPicked} selected={selected === id} fovOrientation={fovOrientation} isFirst={isFirst} isLast={isLast} />

      })}
    </FeatureGroup>
  }
})
