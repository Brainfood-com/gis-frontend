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
    const {allPoints, zoom, range, points, canvases, canvas, onItemPicked} = this.props
    if (!range || !points || !canvases) return <div/>
    const fovOrientation = range.get('fovOrientation', 'left')
    const selected = canvas ? canvas.get('id') : null
    return <FeatureGroup>
      {canvases.filter(canvas => canvas).map(canvas => {
        const id = canvas.get('id')
        const rangePoint = points.get(id)
        return <DraggableCanvasPosition key={id} zoom={zoom} canvas={canvas} rangePoint={rangePoint} allPoints={allPoints} onUpdatePoint={this.onUpdatePoint} onCanvasSelect={onItemPicked} selected={selected === id} fovOrientation={fovOrientation}/>

      })}
    </FeatureGroup>
  }
})
