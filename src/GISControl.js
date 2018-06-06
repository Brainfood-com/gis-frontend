import React from 'react'

import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'

import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'

import GISMap from './GISMap'
import GISPicView from './GISPicView'
import GISPosition from './GISPosition'

import {CanvasDetail, CanvasCard, CanvasGrid, CanvasList, CanvasSlidingList} from './iiif/Canvas'
import {StructureDetail} from './iiif/Structure'
import {IIIFTree} from './IIIF'
import {makeUrl} from './api'

/*
 *  /---------------+--------\
 *  |left|          |pic-view|
 *  |    +----------+--------+
 *  |    |timeline           |
 *  \----+-------------------/
 */

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
    height: '100%',
  },
  hidden: {
    display: 'none',
  },
  canvasDetail: {
  },
  removeOverride: {
    background: 'white',
    color: 'black',
  },
  mapViewLeft: {
    width: '20%',
    maxWidth: '20%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'scroll',
  },
  mapViewMiddle: {
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
    width: '100%',
  },
  mapViewRight: {
    maxWidth: '25%',
    minWidth: 100,
  },
  mapViewBottom: {
    minHeight: '10%',
    maxHeight: '15%',
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
  },
  mapViewTop: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
  },
  mapViewBottomLeft: {
    width: '100%',
  },
  mapViewBottomRight: {
    width: '20%',
    minWidth: 100,
  },
}
class GISControl extends React.Component {
  constructor(props) {
    super(props)
    const picked = localStorage.getItem('gis-app.picked')
    this.state = {
      position: 50,
      canvases: [],
      selectedCanvas: null,
      picked: picked ? JSON.parse(picked) : {},
      placement: 'left',
      fieldOfView: 60,
    }
  }

  handleOnPositionChange = (position) => {
    const {canvases, picked} = this.state
    this.setState({position})
    if (canvases) {
      const canvasIndex = Math.floor((canvases.length - 1) * position / 100)
      if (canvasIndex < canvases.length) {
        const canvas = canvases[canvasIndex].id
        this.setState({picked: {...picked, canvas}})
        this.saveLocally()
      }
    }
  }

  saveLocally() {
    this.setState((prevState, props) => {
      localStorage.setItem('gis-app.picked', JSON.stringify(prevState.picked))
      const {canvases, picked} = this.state
      if (picked.canvas !== null) {
        const canvasIndex = canvases.findIndex(canvas => canvas.id === picked.canvas)
        const position = canvasIndex / (canvases.length - 1) * 100
        return {position}
      }
    })
  }

  handleOnItemPicked = (type, item) => {
    const {id} = item || {}
    const {picked} = this.state
    console.log('onItemPicked', type, item)
    switch (type) {
      case 'collection':
        if (picked.collection !== id) {
          this.setState({picked: {...picked, collection: id, manifest: null, structure: null, structureItem: null, canvas: null}, canvases: []})
          this.saveLocally()
        }
        break
      case 'manifest':
        if (picked.manifest !== id) {
          this.setState({picked: {...picked, manifest: id, structure: null, structureItem: null, canvas: null}, canvases: []})
          this.saveLocally()
        }
        break
      case 'structure':
        if (picked.structure !== id) {
          this.setState({picked: {...picked, structure: id, structureItem: item, canvas: null}, canvases: []})
          this.saveLocally()
          this.fetchCanvasPoints()
        } else if (picked.structureItem !== item) {
          this.setState({picked: {...picked, structureItem: item, canvas: null}, canvases: []})
        }
        break
    }
  }

  fetchCanvasPoints = () => {
    this.setState((prevState, props) => {
      const {
        picked: {
          manifest,
          structure,
        }
      } = prevState
      if (!manifest || !structure) {
        return
      }
      fetch(makeUrl('api', `manifest/${manifest}/range/${structure}/canvasPoints`)).then(data => data.json()).then(this.processCanvasResult)
    })
  }

  componentWillMount() {
    this.fetchCanvasPoints()
  }

  processCanvasResult = canvasesDetail => {
    const {picked} = this.state
    const {onCanvasList} = this.props
    const canvasesById = {}
    canvasesDetail.forEach(canvasDetail => {
      canvasesById[canvasDetail.id] = canvasDetail
    })
    function canvasToLatLng(canvas) {
      return {
        lat: canvas.point.coordinates[1],
        lng: canvas.point.coordinates[0],
      }
    }
    const canvases = canvasesDetail.filter(canvas => canvas && canvas.thumbnail)
    const bearingPoints = new Array(2)
    bearingPoints[0] = canvasToLatLng(canvases[0])
    for (let i = 0; i < canvases.length; i++) {
      canvases[i].latlng = bearingPoints[1] = canvasToLatLng(canvases[i])
      if (i > 0) {
        canvases[i - 1].bearing = L.GeometryUtil.bearing(...bearingPoints)
      }
      bearingPoints[0] = bearingPoints[1]
    }
    canvases[canvases.length - 1].bearing = canvases[canvases.length - 2]

    const canvasIndex = picked.canvas && canvases.findIndex(canvas => canvas.id === picked.canvas) || 0
    const canvas = canvases.length ? canvases[canvasIndex] : null
    if (canvas !== null) {
      const position = canvasIndex / (canvases.length - 1) * 100
      this.setState({position})
    }
    this.setState({picked: {...picked, canvas: canvas.id}, canvases})
    this.saveLocally()
  }

  handleOnUpdatePoint = (id, point) => {
    const {picked, canvases} = this.state
    if (id === null) {
      return
    }
    const canvasItem = canvases.find(canvasItem => canvasItem.id === id)
    fetch(makeUrl('api', `manifest/${picked.manifest}/canvas/${id}/point/web`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        priority: 1,
        notes: 'foo',
        point: point ? {
          type: 'Point',
          coordinates: [point.lng, point.lat],
        } : null,
      }),
    }).then(data => data.json()).then(result => {
      this.fetchCanvasPoints()
    })
  }

  handleOnCanvasSelect = newCanvas => {
    const {picked} = this.state
    this.setState({picked: {...picked, canvas: picked.canvas === newCanvas.id ? null : newCanvas.id}})
    this.saveLocally()
  }

  handleOnCanvasMapSelect = newCanvas => {
    const {picked} = this.state
    if (picked.canvas !== newCanvas.id) {
      this.setState({picked: {...picked, canvas: newCanvas.id}})
      this.saveLocally()
    }
  }

  removeSelectedOverride = () => {
    const {picked} = this.state
    this.handleOnUpdatePoint(picked.canvas, null)
  }

  handleOnStructureUpdate = (structure, data) => {
    const {fieldOfView, placement} = data
    console.log('handleOnStructureUpdate', fieldOfView, placement)
    this.setState({fieldOfView, placement})
  }

  render() {
    const {children, classes} = this.props
    const {canvases, position, picked, placement, fieldOfView} = this.state
    const selectedStructureItem = picked.structureItem
    const selectedCanvasItem = canvases.find(canvas => picked.canvas === canvas.id)
    return <div className={classes.root}>
      <div className={classes.mapViewTop}>
        <div className={classes.mapViewLeft}>
          <IIIFTree picked={picked} onCanvasList={this.handleOnCanvasList} onItemPicked={this.handleOnItemPicked}/>
          <StructureDetail structure={selectedStructureItem} placement={placement} fieldOfView={fieldOfView} onUpdate={this.handleOnStructureUpdate}/>
          <CanvasDetail canvas={selectedCanvasItem} onRemoveOverride={this.removeSelectedOverride}/>
        </div>
        <div className={classes.mapViewMiddle}>
          <GISMap position={position} canvases={canvases} onUpdatePoint={this.handleOnUpdatePoint} onCanvasSelect={this.handleOnCanvasMapSelect} selectedCanvas={picked.canvas} placement={placement} fieldOfView={fieldOfView}/>
        </div>
      </div>
      <div className={classes.mapViewBottom}>
        <div className={classes.mapViewBottomLeft}>
          <GISPosition position={position} onPositionChange={this.handleOnPositionChange}/>
          <CanvasSlidingList canvases={canvases} selected={picked.canvas} onSelect={this.handleOnCanvasMapSelect}/>
        </div>
      </div>
    </div>
  }
}

export default withStyles(styles)(GISControl)
