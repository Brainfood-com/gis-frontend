import flow from 'lodash-es/flow'
import Immutable from 'immutable'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import List from '@material-ui/core/List'
import Card from '@material-ui/core/Card'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import Dialog from '@material-ui/core/Dialog'
import AppBar from '@material-ui/core/AppBar'
import CloseIcon from '@material-ui/icons/Close'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'

import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import {DragSource} from 'react-dnd'
import {getEmptyImage} from 'react-dnd-html5-backend'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css'
import 'font-awesome/css/font-awesome.css'


import GoogleStreetView from '../GoogleStreetView'
import CanvasLeaflet from './CanvasLeaflet'
import classnames from 'classnames'
import Relider from 'relider'

import connectHelper from '../connectHelper'
import * as iiifRedux from './redux'
import {picked} from './Picked'

export function handleCanvasWheel({canvases, canvas, onItemPicked, event}) {
  const {deltaX, deltaY, deltaZ, deltaMode} = event
  if (deltaX === 0) {
    return
  }
  event.preventDefault()
  if (!!!canvases) return
  const position = canvases.findIndex(item => item === canvas)
  if (position === -1) return
  const nextPosition = position + Math.sign(deltaX)
  if (nextPosition >= 0 && nextPosition < canvases.size) {
    onItemPicked(canvases.get(nextPosition).get('id'))
  }
}

const canvasCardBaseStyles = {
  root: {
    paddingBottom: '56.25%',
    position: 'relative',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: '4px solid transparent',
    '&> img': {
      width: '100%',
      height: '100%',
    },
    '$root$selected > &': {
      borderBottomColor: 'white',
    },
    '$override > &': {
      borderColor: 'red',
    },
    '$loading > &': {
      backgroundColor: '#aaaaaa',
    },
  },
  selected: {},
  override: {},
  exclude: {
    '& $excludeTopLeft': {
      display:'block',
    },
    '& $excludeBottomLeft': {
      display:'block',
    },
  },
  excludeTopLeft: {
    zIndex: 1,
    display:'none',
    position:'absolute',
    height: '100%',
    content: '',
    background: 'linear-gradient(to top right, rgba(255, 0,0,0) calc(50% - 2px), #F00, rgba(255, 0,0,0) calc(50% + 2px) )',
    width: '100%',
  },
  excludeBottomLeft: {
    zIndex: 1,
    display:'none',
    position:'absolute',
    height: '100%',
    content: '',
    background: 'linear-gradient(to bottom right, rgba(255, 0,0,0) calc(50% - 2px), #F00, rgba(255, 0,0,0) calc(50% + 2px) )',
    width: '100%',
  },
  hole: {},
  loading: {},
/*
.crossed {
    position: relative;
    width: 300px;
    height: 300px;
}

.crossed:before {
}
  */
}

const canvasHasOverride = canvas => {
  if (canvas) {
    const overrides = canvas.get('overrides')
    return overrides && !!overrides.find(override => override.get('point'))
  }
  return false
}

const CanvasCardBase = withStyles(canvasCardBaseStyles)(class CanvasCardBase extends React.Component {
  static defaultProps = {
    onItemPicked(id) {},
  }

  constructor(props) {
    super(props)
    const {canvas} = props
    this.state = {
      loading: true,
      image: canvas ? canvas.get('image') : null,
    }
  }

  handleOnWheel = event => {
    const {canvases, canvas, onItemPicked} = this.props
    handleCanvasWheel({canvases, canvas, onItemPicked, event})
  }

  handleOnLoad = event => {
    this.setState({loading: false})
  }

  componentWillReceiveProps(nextProps) {
    const {canvas} = nextProps
    const image = canvas ? canvas.get('image') : null
    if (this.state.image !== image) {
      this.setState({image, loading: true})
    }
  }

  handleOnClick = event => {
    const {canvas, onItemPicked} = this.props
    onItemPicked(canvas.get("id"))
  }

  render() {
    const {className, classes, canvas, selected} = this.props
    const {image, loading} = this.state
    if (!image) {
      return <div/>
    }
    const wantedClasses = {
      [classes.root]: true,
      [classes.selected]: selected,
      [classes.override]: canvasHasOverride(canvas),
      [classes.exclude]: canvas.get('exclude'),
      [classes.hole]: canvas.get('hole'),
      [classes.loading]: loading,
    }
    return <div className={classnames(wantedClasses, className)} onWheel={this.handleOnWheel}>
      <div className={classes.excludeTopLeft} onClick={this.handleOnClick}/>
      <div className={classes.excludeBottomLeft} onClick={this.handleOnClick}/>
      <Card className={classes.card} onClick={this.handleOnClick}>
        <img src={`${image}/full/400,/0/default.jpg`} onLoad={this.handleOnLoad}/>
      </Card>
    </div>
  }
})

const canvasCardDragPreviewStyles = {
  root: {
    opacity: 0.4,
    backgroundColor: 'black',
    cursor: 'none',
    position: 'relative',
  },
  marker: {
    zIndex: 1,
    color: 'red',
    cursor: 'none',
    bottom: '-100%',
    left: '50%',
    position: 'absolute',
    transform: 'translate(-50%, 0%)',
  },
}

const CanvasCardDragPreview = withStyles(canvasCardDragPreviewStyles)(class CanvasCardDragPreview extends React.Component {
  render() {
    const {className, classes, canvas, selected, ...props} = this.props
    return <div className={classnames(classes.root, className)}>
      <i className={classnames('fa fa-map-marker fa-3x', classes.marker)}/>
    </div>
  }
})

const canvasCardStyles = {
  root: {
    position: 'relative',
    '&$isDragging > $draggingOverlay': {
      display: 'block',
    },
    cursor: 'grab',
  },
  draggingOverlay: {
    position: 'absolute',
    zIndex:1,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.8,
    backgroundColor: 'black',
    display: 'none',
  },
  isDragging: {},
}

const CanvasCardType = Symbol('CanvasCard')

const canvasCardSource = {
  beginDrag(props, monitor) {
    const {canvas, selected} = props
    return {canvas, selected}
  },
}

export const CanvasCard = DragSource(CanvasCardType, canvasCardSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
}))(withStyles(canvasCardStyles)(class CanvasCard extends React.Component {
  static TYPE = CanvasCardType
  static PREVIEW = CanvasCardDragPreview

  componentDidMount() {
    const { connectDragPreview } = this.props
    if (connectDragPreview) {
      connectDragPreview(getEmptyImage(), {
        //anchorX: 0.5,
        //anchorY: 0.5,
        captureDraggingState: false,
      })
    }
  }

  render() {
    const {connectDragSource, isDragging, className, classes, ...props} = this.props
    const wantedClasses = {
      [classes.root]: true,
      [classes.isDragging]: isDragging,
    }
    return connectDragSource(
      <div className={classnames(wantedClasses, className)}>
        <div className={classes.draggingOverlay}/>
        <CanvasCardBase {...props}/>
      </div>
    )
  }
}))

const canvasStreetViewStyles = {
}

export const CanvasStreetView = withStyles(canvasStreetViewStyles)(class CanvasStreetView extends React.Component {
  static defaultProps = {
    onItemPicked(id) {},
  }

  constructor(props) {
    super(props)
    const {canvas, points} = props
    const rangePoint = points && canvas && points.get(canvas.get('id'))
    this.state = {
      loading: true,
      rangePoint: rangePoint,
    }
  }

  handleOnWheel = event => {
    const {canvases, canvas, onItemPicked} = this.props
    handleCanvasWheel({canvases, canvas, onItemPicked, event})
  }

  handleOnLoad = event => {
    this.setState({loading: false})
  }

  componentWillReceiveProps(nextProps) {
    const {points, canvas} = nextProps
    const rangePoint = points && canvas && points.get(canvas.get('id'))
    if (this.state.rangePoint !== rangePoint) {
      this.setState({rangePoint, loading: true})
    }
  }

  handleOnClick = event => {
    const {canvas, onItemPicked} = this.props
    onItemPicked(canvas.get("id"))
  }

  render() {
    const {className, classes, canvas, selected} = this.props
    const {rangePoint, loading} = this.state
    if (!rangePoint) {
      return <div/>
    }
    const wantedClasses = {
      [classes.root]: true,
      [classes.selected]: selected,
      [classes.override]: canvasHasOverride(canvas),
      [classes.loading]: loading,
    }
    return <div className={classnames(wantedClasses, className)} onWheel={this.handleOnWheel}>
      <Card className={classes.card} onClick={this.handleOnClick}>
        <GoogleStreetView location={rangePoint.latlng} bearing={location.bearing}/>
      </Card>
    </div>
  }
})

const canvasFormStyles = {
  root: {
  },
  card: {
  },
  removeOverride: {
    background: 'white',
    color: 'black',
    display: 'none',
    '$override >&': {
      display: 'block',
    },
  },

  hidden: {
    display: 'none',
  },
  override: {},
}
const fieldInputProcessors = {
  tags(value) {
    return value.split(/\n+/)
  },
  exclude(value, checked) {
    return checked
  },
  hole(value, checked) {
    return checked
  },
}

export const CanvasForm = flow(picked(['range', 'canvas']), withStyles(canvasFormStyles))(class CanvasForm extends React.Component {
  static defaultProps = {
    updateCanvas(id, data) {},
    deleteCanvasPointOverride(id) {},
    onItemPicked(id) {},
  }

  constructor(props) {
    super(props)
    this.state = {dialogOpen: false}
  }

  handleOnWheel = event => {
    const {canvases, canvas, onItemPicked} = this.props
    handleCanvasWheel({canvases, canvas, onItemPicked, event})
  }

  handleInputChange = event => {
    const {canvas, updateCanvas} = this.props
    const {name, value, checked} = event.currentTarget
    const {[name]: inputProcessor = (value, checked) => value} = fieldInputProcessors
    const processedValue = inputProcessor(value, checked)
    const currentValue = canvas.get(name)
    if (currentValue !== processedValue) {
      updateCanvas(canvas.get('id'), {[name]: processedValue})
    }
  }

  handleRemoveOverride = (event) => {
    const {range, canvas, deleteRangePoint} = this.props
    deleteRangePoint(range.get('id'), canvas.get('id'), {sourceId: 'web'})
  }

  largePhotoView = (event) => {
    console.log('Large photo view')
    this.setState({dialogOpen: true})
  }

  handleClose() {
    this.setState({dialogOpen: false})
  }

  render() {
    const {className, classes, canvases, points, canvas, selected, onItemPicked} = this.props
    if (!canvas) return <div />
    const hasOverride = canvasHasOverride(canvas)
    const image = canvas.get('image')
    const point = canvas.get('point')
    const rootClasses = {
      [classes.root]: true,
      [classes.hidden]: !!!canvas,
      [classes.override]: hasOverride,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <CanvasCard canvases={canvases} canvas={canvas} className={classes.card} onItemPicked={onItemPicked}/>
      <CanvasStreetView canvases={canvases} points={points} canvas={canvas} className={classes.card} onItemPicked={onItemPicked} size='400x225'/>
      <Dialog
        keepMounted={true}
        onWheel={this.handleOnWheel_}
        fullScreen
        open={this.state.dialogOpen}
        onClose={() => this.handleClose()}
      >
        <AppBar style={{position: 'relative'}}>
          <IconButton color="inherit" onClick={() => this.handleClose()} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </AppBar>
        <CanvasLeaflet canvases={canvases} canvas={canvas} onItemPicked={onItemPicked} />
      </Dialog>
      <Button fullWidth variant='raised' onClick={this.largePhotoView}>Inspect</Button>
      {point}
      <FormGroup row>
        <FormControlLabel label='Exclude' control={
          <Checkbox name='exclude' checked={!!canvas.get('exclude')} onChange={this.handleInputChange}/>
        }/>
        <FormControlLabel label='Hole' control={
          <Checkbox name='hole' checked={!!canvas.get('hole')} onChange={this.handleInputChange}/>
        }/>
        <FormControlLabel label='Override' control={
          <Checkbox name='override' disabled={!hasOverride} checked={!!hasOverride} onChange={this.handleRemoveOverride}/>
        }/>
      </FormGroup>
      <TextField name='notes' fullWidth label='Notes' value={canvas.get('notes') || ''} multiline={true} rows={3} onChange={this.handleInputChange}/>
      <TextField name='tags' fullWidth label='Tags' value={canvas.get('tags', []).join("\n")} multiline={true} rows={3} onChange={this.handleInputChange}/>
    </Paper>
  }
})

const canvasGridStyles = {
  root: {
  },
}

export const CanvasGrid = withStyles(canvasGridStyles)(class CanvasGrid extends React.Component {
  render() {
    const {classes, className, canvases, selected, onItemPicked} = this.props
    return <GISGrid className={classnames(classes.root, className)}>
      {canvases.map(canvas => <CanvasCard key={canvas.id} selected={selected === canvas.id} canvases={canvases} canvas={canvas} onItemPicked={onItemPicked}/>)}
    </GISGrid>
  }
})

const canvasListStyles = {
  root: {
    overflowX: 'scroll',
    width: 'auto',
    height: 108,
  },
  card: {
    display: 'inline-block',
    width: 200,
  },
}
export const CanvasList = withStyles(canvasListStyles)(class CanvasList extends React.Component {
  render() {
    const {className, classes, canvases, selected, onItemPicked} = this.props

    return <div className={classnames(classes.root, className)}>
      {canvases.map(canvas => <CanvasCard key={canvas.id} canvases={canvases} canvas={canvas} className={classes.card} selected={selected === canvas.id} onItemPicked={onItemPicked}/>)}
    </div>
  }
})

const canvasSlidingListStyles = {
  root: {
    width: '100%',
    '& $handleDefault': {
      borderWidth: 1,
      borderStyle: 'solid',
      backgroundColor:'white',
    },
    '& $handleCurrent$handleOverride': {
      borderColor:['white', '!important'],
    },
    '& $handleCurrent$handleExclude': {
      borderColor:['white', '!important'],
    },
    '& $handleOverride': {
      backgroundColor:'red',
      borderColor:'red',
    },
    '& $handleExclude': {
      backgroundColor:'black',
      borderColor: 'black',
    },
  },
  container0: {
    display: 'inline-block',
    width: '20%',
  },
  container1: {
    display: 'inline-block',
    width: '15%',
  },
  container2: {
    display: 'inline-block',
    width: '11%',
  },
  container3: {
    display: 'inline-block',
    width: '8%',
  },
  container4: {
    display: 'inline-block',
    width: '6%',
  },
  handleDefault: {
  },
  handleCurrent: {
  },
  handleOverride: {
  },
  handleExclude: {
  },
}

export const CanvasSlidingList = flow(picked(['range', 'canvas']), withStyles(canvasSlidingListStyles))(class CanvasSlidingList extends React.Component {
  handleOnReliderChange = (handles) => {
    const {onItemPicked, canvases} = this.props
    const {value: position} = handles.find(handle => !handle.readOnly)
    const canvas = canvases.get(position)
    onItemPicked(canvas.get('id'))
  }

  handleOnWheel = event => {
    const {canvases, canvas, onItemPicked} = this.props
    handleCanvasWheel({canvases, canvas, onItemPicked, event})
  }

  render() {
    const {className, classes, canvases, canvas, onItemPicked} = this.props
    if (!!!canvases) return <div/>
    const position = canvases.findIndex(item => item === canvas)
    if (position === -1) return <div/>

    function pickCanvas(offset) {
      const absOffset = Math.abs(offset)
      const index = position + offset
      const className = classes[`container${absOffset}`]
      if (index < 0) {
        return <div key={`in-${absOffset}`} className={className}/>
      } else if (index >= canvases.size) {
        return <div key={`out-${absOffset}`} className={className}/>
      } else if (canvases) {
        const item = canvases.get(index)
        if (item) {
          const id = item.get('id')
          return <div key={`canvas-${id}`} className={className}><CanvasCard canvases={canvases} canvas={item} selected={item === canvas} onItemPicked={onItemPicked}/></div>
        } else {
          return <div key={`not-loaded-${index}`} className={className}>[canvas-not-loaded{offset}:{index}]</div>
        }
      } else {
        return <div key={`missing-${offset}`}/>
      }
    }

    const allHandles = canvases.map((item, index) => {
      if (!item) {
        return
      }
      const hasOverrides = item.get('overrides')
      const isExcluded = item.get('exclude')
      const isCurrent = item === canvas
      const result = {
        value: index,
        readOnly: !isCurrent,
        className: classnames(classes.handleDefault, hasOverrides && classes.handleOverride, isExcluded && classes.handleExclude, isCurrent && classes.handleCurrent),
      }
      return hasOverrides || isExcluded || isCurrent ? result : null
    }).filter(item => item).toJSON()

    const cells = new Array(9)
    const count = Math.floor(cells.length / 2)
    for (let j = 0; j <= count; j++) {
      cells[count + j] = pickCanvas(j)
      cells[count - j] = pickCanvas(-j)
    }

    return <div className={classnames(classes.root, className)} onWheel={this.handleOnWheel}>
      <div className={classes.relider}>
        <Relider
          onDragStop={this.handleOnDragStop}
          style={{width: '100%'}}
          horizontal={true}
          reversed={false}
          min={0}
          max={canvases.size - 1}
          step={1}
          tickStep={5}
          handles={allHandles}
          onChange={this.handleOnReliderChange}
        />
      </div>
      {cells}
    </div>
  }
})

/*
	handleOnChange = (handles) => {
    const {onPositionChange} = this.props
    const position = handles[0].value
    this.setState({position})
    onPositionChange(position)
  }

  render() {
    const {children, classes} = this.props
    const {position} = this.state
    return <Paper className={classes.root}>

    </Paper>
  }
*/

