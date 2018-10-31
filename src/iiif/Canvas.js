import flow from 'lodash-es/flow'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Card from '@material-ui/core/Card'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import AppBar from '@material-ui/core/AppBar'
import CloseIcon from '@material-ui/icons/Close'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'

import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import PlaceIcon from '@material-ui/icons/Place';
import InfoIcon from '@material-ui/icons/Info';
import LocationDisabledIcon from '@material-ui/icons/LocationDisabled';
import BlockIcon from '@material-ui/icons/Block';
import StreetviewIcon from '@material-ui/icons/Streetview';
import {DragSource} from 'react-dnd'
import {getEmptyImage} from 'react-dnd-html5-backend'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers'
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css'
import 'font-awesome/css/font-awesome.css'


import ItemPanel from '../ItemPanel'
import GoogleStreetView from '../GoogleStreetView'
import CanvasLeaflet from './CanvasLeaflet'
import classnames from 'classnames'
import Relider from 'relider'

import connectHelper from '../connectHelper'
import * as iiifRedux from './redux'
import {picked} from './Picked'
import DebouncedForm from '../DebouncedForm'
import IIIFTagEditor, {commonTagDefinitions} from './Tags'

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

const canvasTagSuggestions = [
  commonTagDefinitions.BROKEN_IMAGE,
]

const canvasCardBaseStyles = {
  root: {
    paddingBottom: '56.25%',
    position: 'relative',
    '&$isDragging > $draggingOverlay': {
      display: 'block',
    },
    '&$isDraggable': {
      cursor: 'grab',
    },
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
  override: {
    '& $overrideButton': {
      display: 'initial',
    },
  },
  overrideButton: {
    display: 'none',
    backgroundColor: 'red',
  },
  overrideIcon: {
    color: 'white',
  },
  exclude: {
    '& $excludeTopLeft': {
      display:'block',
    },
    '& $excludeBottomLeft': {
      display:'block',
    },
    '& $excludeButton': {
      backgroundColor: 'red',
    },
    '& $excludeIcon': {
      color: 'white',
    },
  },
  excludeButton: {},
  excludeIcon: {},
  hole: {
    '& $holeButton': {
      backgroundColor: 'red',
    },
    '& $holeIcon': {
      color: 'white',
    },
  },
  holeButton: {},
  holeIcon: {},
  infoIcon: {},
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
  upperLeft: {
    zIndex: 1,
    position:'absolute',
    left:6,
    top:6,
  },
  upperLeftContent: {
  },
  upperLeftItem: {
  },
  upperRight: {
    zIndex: 1,
    position:'absolute',
    right:6,
    top:6,
  },
  upperRightContent: {
  },
  upperRightItem: {
  },
  lowerLeft: {
    zIndex: 1,
    position:'absolute',
    left:6,
    bottom:6,
  },
  lowerLeftContent: {
  },
  lowerLeftItem: {
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
  isDraggable: {},
  isDragging: {},
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

const CanvasCardType = Symbol('CanvasCard')

const canvasCardSource = {
  beginDrag(props, monitor) {
    const {canvas, selected} = props
    return {canvas, selected}
  },
  endDrag(props, monitor, component) {
    const didDrop = monitor.didDrop()
    console.log('endDrag', component)
  },
}

const CanvasCardBase = flow(DragSource(CanvasCardType, canvasCardSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
})), withStyles(canvasCardBaseStyles))(class CanvasCardBase extends React.Component {
  static defaultProps = {
    onItemPicked(id) {},
    isDraggable: false,
  }

  constructor(props) {
    super(props)
    const {canvas} = props
    this.state = {
      loading: true,
      image: canvas ? canvas.get('image') : null,
      infoDialogOpen: false,
    }
  }

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

  handleOnToggleClick = event => {
    const {canvas, updateCanvas} = this.props
    const {name, value, checked} = event.currentTarget
    const {[name]: inputProcessor = (value, checked) => value} = fieldInputProcessors
    const currentValue = canvas.get(name)
    const processedValue = inputProcessor(value, !currentValue)
    updateCanvas(canvas.get('id'), {[name]: processedValue})
  }

  handleOnOpenDialog = event => {
    const {name} = event.currentTarget
    const propName = `${name}DialogOpen`
    this.setState({[propName]: true})
  }

  handleOnCloseDialog = (event, name) => {
    const propName = `${name}DialogOpen`
    this.setState({[propName]: false})
  }

  handleRemoveOverride = (event) => {
    const {range, canvas, deleteRangePoint} = this.props
    deleteRangePoint(range.get('id'), canvas.get('id'), {sourceId: 'web'})
  }

  render() {
    const {className, classes, connectDragSource, isDraggable, isDragging, canvas, points, selected} = this.props
    const {infoDialogOpen, image, loading} = this.state
    if (!image) {
      return <div/>
    }
    const rangePoint = points && canvas && points.get(canvas.get('id')) || {}
    const {
      googleVision: {
        rgb: [
          red = 0,
          green = 0,
          blue = 0,
        ] = [],
      } = {},
    } = rangePoint
    const wantedClasses = {
      [classes.root]: true,
      [classes.selected]: selected,
      [classes.override]: canvasHasOverride(canvas),
      [classes.exclude]: canvas.get('exclude'),
      [classes.hole]: canvas.get('hole'),
      [classes.loading]: loading,
      [classes.isDraggable]: isDraggable,
      [classes.isDragging]: isDragging,
    }
    const result = <div className={classnames(wantedClasses, className)} onWheel={this.handleOnWheel}>
       <div className={classes.draggingOverlay}/>
      <div className={classes.excludeTopLeft} onClick={this.handleOnClick}/>
      <div className={classes.excludeBottomLeft} onClick={this.handleOnClick}/>
      <Card className={classes.card} style={{backgroundColor: `rgb(${red}, ${green}, ${blue})`}}>
        <img src={`${image}/full/400,/0/default.jpg`} onLoad={this.handleOnLoad} onClick={this.handleOnClick} />
      </Card>
      <div className={classes.upperLeft}>
        <div className={classes.upperLeftContent}>
          <Button className={classes.excludeButton} mini variant='fab' name='exclude' onClick={this.handleOnToggleClick}><BlockIcon titleAccess='Exclude' className={classes.excludeIcon}/></Button>
          <Button className={classes.holeButton} mini variant='fab' name='hole' onClick={this.handleOnToggleClick}><LocationDisabledIcon titleAccess='Hole' className={classes.holeIcon}/></Button>
          <Button className={classes.overrideButton} mini variant='fab' name='override' onClick={this.handleRemoveOverride}><PlaceIcon titleAccess='Override' className={classes.overrideIcon}/></Button>
        </div>
      </div>
      <div className={classes.upperRight}>
        <div className={classes.upperRightContent}>
          <CanvasStreetView className={classes.upperRightItem} mini variant='fab' canvas={canvas}><StreetviewIcon titleAccess='Street View'/></CanvasStreetView>
        </div>
      </div>
      <div className={classes.lowerLeft}>
        <div className={classes.lowerLeftContent}>
          <Button className={classes.lowerLeftItem} mini variant='fab' name='info' onClick={this.handleOnOpenDialog}><InfoIcon titleAccess='Info' className={classes.infoIcon}/></Button>
        </div>
      </div>
      <CanvasInfo name='info' onClose={this.handleOnCloseDialog} open={infoDialogOpen} canvas={canvas}/>
    </div>
    return isDraggable ? connectDragSource(result) : result
  }
})

const canvasInfoStyles = {
}

export const CanvasInfo = flow(picked(['range']), withStyles(canvasInfoStyles))(class CanvasInfo extends React.Component {
  static defaultProps = {
    onClose(event, name) {},
  }

  onClose = event => {
    this.props.onClose(event, this.props.name)
  }

  render() {
    const {name, className, classes, range, canvases, updateOwner, updateRange, onItemPicked, buildings, points, canvas, ...props} = this.props
    const canvasPoint = points && points.get(canvas.get('id')) || {}
    const canvasLocation = canvasPoint && canvasPoint.point
    const canvasBuildings = (canvasPoint.buildings || []).map(id => buildings.get(id))
    const image = canvas.get('image')
    const {
      googleVision: {
        rgb: [
          red = 0,
          green = 0,
          blue = 0,
        ] = [],
      } = {},
    } = canvasPoint

    return <Dialog {...props} onClose={this.onClose}>
      <DialogTitle>Canvas {canvas.get('label')}</DialogTitle>
      <DialogContent>
        <Card className={classes.card} style={{backgroundColor: `rgb(${red}, ${green}, ${blue})`}}>
          <img src={`${image}/full/400,/0/default.jpg`}/>
        </Card>
        <List dense>
          <ListItem>
            <ListItemText primary={`${canvasPoint && canvasPoint['addr_number']} ${canvasPoint && canvasPoint['addr_fullname']} ${canvasPoint && canvasPoint['addr_zipcode']}`}/>
          </ListItem>
          <ListItem>
            <ListItemText inset={false} primary={<CanvasStreetView mini canvas={canvas}/>}/>
          </ListItem>
          <ListItem>
            <ListItemText primary={`
            Lat: ${canvasLocation && canvasLocation.coordinates[1]}
            Long: ${canvasLocation && canvasLocation.coordinates[0]}
            `}/>
          </ListItem>
          <ListItem>
            <ListItemText primary='Tax Lots'/>
          </ListItem>
          <List>
            {canvasBuildings.map(building => {
              if (!building) {
                return null
              }
              const taxdata = building.get('taxdata')
              if (!taxdata) {
                // seems to happen with courtyards
                return null
              }
              const ain = building.get('ain')
              const yearbuilt = taxdata.get('year_built')
              return <ListItem key={ain}><ListItemText primary={`ain: ${ain}`} secondary={`built: ${yearbuilt}`}/></ListItem>
            })}
          </List>
        </List>
      </DialogContent>
    </Dialog>
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

export class CanvasCard extends React.Component {
  static TYPE = CanvasCardType
  static PREVIEW = CanvasCardDragPreview

  render() {
    return <CanvasCardBase {...this.props} isDraggable={true}/>
  }
}

const canvasStreetViewStyles = {
}

export const CanvasStreetView = flow(picked(['range']), withStyles(canvasStreetViewStyles))(class CanvasStreetView extends React.Component {
  static defaultProps = {
    onItemPicked(id) {},
  }

  constructor(props) {
    super(props)
    const {canvas, points} = props
    const rangePoint = points && canvas && points.get(canvas.get('id'))
    this.state = {
      rangePoint: rangePoint,
    }
  }

  componentWillReceiveProps(nextProps) {
    const {points, canvas} = nextProps
    const rangePoint = points && canvas && points.get(canvas.get('id'))
    if (this.state.rangePoint !== rangePoint) {
      this.setState({rangePoint})
    }
  }

  render() {
    const {buildings, range, points, canvases, canvas, updateOwner, updateRange, onItemPicked, ...props} = this.props
    const {rangePoint} = this.state
    if (!rangePoint) {
      return <div/>
    }
    const fovOrientation = range.get('fovOrientation', 'left')
    return <GoogleStreetView {...props} location={rangePoint.latlng} heading={rangePoint.bearing + (fovOrientation === 'left' ? -90 : 90)}/>
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

export const CanvasForm = flow(picked(['range', 'canvas']), withStyles(canvasFormStyles))(class CanvasForm extends DebouncedForm {
  static defaultProps = {
    updateCanvas(id, data) {},
    deleteCanvasPointOverride(id) {},
    onItemPicked(id) {},
  }

  constructor(props) {
    super(props)
    this.state = {...this.state, dialogOpen: false}
  }

  handleOnWheel = event => {
    const {canvases, canvas, onItemPicked} = this.props
    handleCanvasWheel({canvases, canvas, onItemPicked, event})
  }

  flushInputChange = (name, value, checked) => {
    const {canvas, updateCanvas} = this.props
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
    const {className, classes, range, deleteRangePoint, canvases, points, updateCanvas, canvas, selected, onItemPicked} = this.props
    if (!canvas) return <div />
    const hasOverride = canvasHasOverride(canvas)
    const image = canvas.get('image')
    const point = canvas.get('point')
    const canvasPoint = points && points.get(canvas.get('id'))
    const rootClasses = {
      [classes.root]: true,
      [classes.hidden]: !!!canvas,
      [classes.override]: hasOverride,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <CanvasCard range={range} deleteRangePoint={deleteRangePoint} updateCanvas={updateCanvas} points={points} canvases={canvases} canvas={canvas} className={classes.card} onItemPicked={onItemPicked}/>
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
      <Typography>{canvasPoint && canvasPoint['addr_number']} {canvasPoint && canvasPoint['addr_fullname']} {canvasPoint && canvasPoint['addr_zipcode']}</Typography>
      <FormGroup row>
        <FormControlLabel label='Exclude' control={
          <Checkbox name='exclude' checked={!!this.checkOverrideValueDefault(canvas, 'exclude', fieldInputProcessors, false)} onChange={this.handleInputChange}/>
        }/>
        <FormControlLabel label='Hole' control={
          <Checkbox name='hole' checked={!!this.checkOverrideValueDefault(canvas, 'hole', fieldInputProcessors, false)} onChange={this.handleInputChange}/>
        }/>
        <FormControlLabel label='Override' control={
          <Checkbox name='override' disabled={!hasOverride} checked={!!hasOverride} onChange={this.handleRemoveOverride}/>
        }/>
      </FormGroup>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault(canvas, 'notes', fieldInputProcessors, '')} multiline={true} rows={3} onChange={this.handleInputChange}/>
      <IIIFTagEditor owner={canvas} updateOwner={updateCanvas} name='tags' suggestions={canvasTagSuggestions}/>
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
      {canvases.map(canvas => <CanvasCard range={range} deleteRangePoint={deleteRangePoint} updateCanvas={updateCanvas} key={canvas.id} selected={selected === canvas.id} canvases={canvases} canvas={canvas} onItemPicked={onItemPicked}/>)}
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
    const {className, classes, canvases, points, selected, onItemPicked} = this.props

    return <div className={classnames(classes.root, className)}>
      {canvases.map(canvas => <CanvasCard range={range} deleteRangePoint={deleteRangePoint} updateCanvas={updateCanvas} key={canvas.id} points={points} canvases={canvases} canvas={canvas} className={classes.card} selected={selected === canvas.id} onItemPicked={onItemPicked}/>)}
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
    overflow: 'hidden',
    '& $cardUpperLeftContent': {
    },
    '& $cardUpperRightContent': {
    },
    '& $cardLowerLeftContent': {
    },
  },
  container1: {
    display: 'inline-block',
    width: '15%',
    overflow: 'hidden',
    '& $cardUpperLeftContent': {
      transform: 'scale(0.85)',
    },
    '& $cardUpperRightContent': {
      transform: 'scale(0.85)',
    },
    '& $cardLowerLeftContent': {
      transform: 'scale(0.85)',
    },
  },
  container2: {
    display: 'inline-block',
    width: '11%',
    overflow: 'hidden',
    '& $cardUpperLeftContent': {
      transform: 'scale(0.70)',
    },
    '& $cardUpperRightContent': {
      transform: 'scale(0.70)',
    },
    '& $cardLowerLeftContent': {
      transform: 'scale(0.70)',
    },
  },
  container3: {
    display: 'inline-block',
    width: '8%',
    overflow: 'hidden',
    '& $cardUpperLeftContent': {
      transform: 'scale(0.60)',
    },
    '& $cardUpperRightContent': {
      transform: 'scale(0.60)',
    },
    '& $cardLowerLeftContent': {
      transform: 'scale(0.60)',
    },
  },
  container4: {
    display: 'inline-block',
    width: '6%',
    overflow: 'hidden',
    '& $cardUpperLeftContent': {
      transform: 'scale(0.50)',
      display: 'none',
    },
    '& $cardUpperRightContent': {
      transform: 'scale(0.50)',
      display: 'none',
    },
    '& $cardLowerLeftContent': {
      transform: 'scale(0.50)',
      display: 'none',
    },
  },
  cardUpperLeftContent: {
    transformOrigin: ['top', 'left'],
  },
  cardUpperRightContent: {
    transformOrigin: ['top', 'right'],
  },
  cardLowerLeftContent: {
    transformOrigin: ['bottom', 'left'],
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
    const {className, classes, range, deleteRangePoint, updateCanvas, canvases, canvas, points, onItemPicked} = this.props
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
          const cardClasses = {
            upperLeftContent: classes.cardUpperLeftContent,
            upperRightContent: classes.cardUpperRightContent,
            lowerLeftContent: classes.cardLowerLeftContent,
          }
          return <div key={`canvas-${id}`} className={className}><CanvasCard range={range} deleteRangePoint={deleteRangePoint} updateCanvas={updateCanvas} classes={cardClasses} points={points} canvases={canvases} canvas={item} selected={item === canvas} onItemPicked={onItemPicked}/></div>
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

export const CanvasPanel = picked(['range', 'canvas'])(class CanvasPanel extends React.Component {
  render() {
    const {className, range, canvas} = this.props

    if (!range) return <div/>
    const title = canvas ? canvas.get('label') : 'Canvas'
    const image = canvas && canvas.get('image')
    const lastImagePart = image && image.replace(/%2F/g, '/').replace(/.*\//, '')
    return <ItemPanel className={className} name={`canvas ${lastImagePart}`} title={title} form={<CanvasForm/>} busy={canvas && canvas.get('_busy')}/>
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

