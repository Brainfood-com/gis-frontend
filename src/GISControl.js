import React from 'react'

import { withStyles } from '@material-ui/core/styles'

import Typography from '@material-ui/core/Typography'

import GISMap from './GISMap'
import GISPicView from './GISPicView'
import GISPosition from './GISPosition'

import {IIIFTree, CanvasGrid, CanvasList} from './IIIF'
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
    width: '100%',
    minHeight: '10%',
    maxHeight: '15%',
  },
  mapViewTop: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
  },
}
class GISControl extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      position: 50,
      canvases: [],
    }
  }

  handleOnPositionChange = (position) => {
    this.setState({position})
  }

  handleOnItemPicked = (type, item = {}) => {
    const {id} = item
    switch (type) {
      case 'collection':
        if (this.state.collection !== item) {
          this.setState({collection: item, manifest: null, structure: null, canvases: []})
        }
        break
      case 'manifest':
        if (this.state.manifest !== item) {
          this.setState({manifest: item, structure: null, canvases: []})
        }
        break
      case 'structure':
        if (this.state.structure !== item) {
          this.setState({structure: item, canvases: []})
          this.fetchCanvasPoints()
        }
        break
    }
  }

  fetchCanvasPoints = () => {
    this.setState((prevState, props) => {
      const {manifest, structure} = prevState
      if (!manifest || !structure) {
        return
      }
      fetch(makeUrl('api', `manifest/${manifest.id}/range/${structure.id}/canvasPoints`)).then(data => data.json()).then(this.processCanvasResult)
    })
  }

  processCanvasResult = canvasesDetail => {
    const {structure} = this.state
    const {onCanvasList} = this.props
    const canvasesById = {}
    canvasesDetail.forEach(canvasDetail => {
      canvasesById[canvasDetail.id] = canvasDetail
    })
    const canvases = structure.canvases.map(canvasId => canvasesById[canvasId]).filter(canvas => canvas && canvas.thumbnail)
    this.setState({canvases})
  }

  handleOnUpdatePoint = (id, point) => {
    const {manfiest, canvases} = this.state
    console.log('handleOnUpdatePoint', id, point)
    const canvasItem = canvases.find(canvasItem => canvasItem.id === id)
    fetch(makeUrl('api', `manifest/${this.state.manifest.id}/canvas/${id}/point/web`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        priority: 1,
        notes: 'foo',
        point: {
          type: 'Point',
          coordinates: [point.lng, point.lat],
        },
      }),
    }).then(data => data.json()).then(result => {
      this.fetchCanvasPoints()
    })
  }

  render() {
    const {children, classes} = this.props
    const {canvases, position} = this.state
    return <div className={classes.root}>
      <div className={classes.mapViewTop}>
        <div className={classes.mapViewLeft}>
          <IIIFTree onCanvasList={this.handleOnCanvasList} onItemPicked={this.handleOnItemPicked}/>
          <CanvasGrid canvases={canvases}/>
        </div>
        <div className={classes.mapViewMiddle}>
          <GISMap position={position} canvases={canvases} onUpdatePoint={this.handleOnUpdatePoint}/>
        </div>
        <div className={classes.mapViewRight}>
          <GISPicView/>
        </div>
      </div>
      <div className={classes.mapViewBottom}>
        <GISPosition position={position} onPositionChange={this.handleOnPositionChange}/>
        <CanvasList canvases={canvases}/>
      </div>
    </div>
  }
}

export default withStyles(styles)(GISControl)
