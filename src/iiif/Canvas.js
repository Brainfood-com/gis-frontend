import {Map as imMap} from 'immutable'
import flow from 'lodash-es/flow'
import React from 'react'
import {Link} from 'react-router-dom'
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
import LinkIcon from '@material-ui/icons/Link'
import CloseIcon from '@material-ui/icons/Close'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'

import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import PlaceIcon from '@material-ui/icons/Place';
import ImageIcon from '@material-ui/icons/Image';
import InfoIcon from '@material-ui/icons/Info';
import LocationDisabledIcon from '@material-ui/icons/LocationDisabled';
import BlockIcon from '@material-ui/icons/Block';
import StreetviewIcon from '@material-ui/icons/Streetview';
import ZoomInIcon from '@material-ui/icons/ZoomIn';
import {DragSource} from 'react-dnd'
import {getEmptyImage} from 'react-dnd-html5-backend'

import ItemPanel from '../ItemPanel'
import GoogleStreetView from '../GoogleStreetView'
import CanvasLeaflet from './CanvasLeaflet'
import classnames from 'classnames'
import Relider from 'relider'

import connectHelper from '../connectHelper'
import * as iiifRedux from './redux'
import {picked} from './Picked'
import IIIFTagEditor, {commonTagDefinitions} from './Tags'
import {immutableEmptyList, immutableEmptyMap} from '../constants'

import {createScrollHandler} from '../ScrollHelper'
import {checkPermissions, picked as userPicked} from '../User'
import { rangeRequiredRole } from './Range'
import { AbstractForm } from './base'

export function handleCanvasNext(event, onCanvasNext) {
  const {deltaX, deltaY, deltaZ, deltaMode} = event
  const delta = deltaX === 0 ? deltaY : deltaX
  if (delta === 0) {
    return
  }
  event.preventDefault()
  onCanvasNext(delta)
}

export function onCanvasNext(delta, {canvases, canvas, onItemPicked}) {
  if (!!!canvases) return
  const position = canvases.findIndex(item => item === canvas)
  if (position === -1) return
  const nextPosition = position + Math.sign(delta)
  if (nextPosition >= 0 && nextPosition < canvases.size) {
    onItemPicked(canvases.get(nextPosition).get('id'))
  }
}
export function handleCanvasWheel({event, ...context}) {
  return handleCanvasNext(event, delta => onCanvasNext(delta, context))
}

function getDerivedStateFromProps(props, state = {}) {
  const {range, canvas} = props
  const newRange = range instanceof imMap ? range.toJS() : range
  const newCanvas = canvas instanceof imMap ? canvas.toJS() : canvas
  const image = newCanvas ? newCanvas.image : null
  return {
    range: newRange,
    canvas: newCanvas,
    image,
    loading: state.image !== image,
  }
}

const canvasTagSuggestions = [
  commonTagDefinitions.BROKEN_IMAGE,
  commonTagDefinitions.DISJOINT_SEQUENCE,
  commonTagDefinitions.NEEDS_REVIEW,
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
    '&$readOnly $holeButton': {
      display: 'none',
    },
    '&$readOnly $excludeButton': {
      display: 'none',
    },
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    '&> img': {
      width: '100%',
      height: '100%',
    },
    '$root$selected > &': {
      borderBottomColor: 'white',
    },
    '$override > &': {
      borderColor: 'green',
    },
  },
  selected: {},
  override: {
    '&$range $overrideButton': {
      display: 'initial',
    },
  },
  overrideButton: {
    display: 'none',
    backgroundColor: 'green',
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
  infoButton: {},
  infoIcon: {},
  inspectButton: {},
  inspectIcon: {},
  linkButton: {},
  linkIcon: {},
  streetViewButton: {},
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
  lowerRight: {
    zIndex: 1,
    position:'absolute',
    right:6,
    bottom:6,
  },
  lowerRightContent: {
  },
  lowerRightItem: {
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
  readOnly: {},
  range: {},
  hidden: {
    display: 'none',
  },
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
  if (canvas instanceof imMap) {
    const overrides = canvas.get('overrides')
    return overrides && !!overrides.find(override => override.get('point'))
  } else {
    const overrides = canvas.overrides
    return overrides && !!overrides.find(override => override.point)
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
})), userPicked('permissions'), withStyles(canvasCardBaseStyles))(class CanvasCardBase extends React.Component {
  static defaultProps = {
    onItemPicked(id) {},
    onInspectClose() {},
    isDraggable: false,
  }

  state = {
    infoDialogOpen: false,
    inspectDialogOpen: false,
  }

  static getDerivedStateFromProps = getDerivedStateFromProps

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

  handleOnWheel = createScrollHandler(delta => {
    const {canvases, onItemPicked} = this.props
    const {canvas} = this.state
    onCanvasNext(delta, {canvases, canvas, onItemPicked})
  })

  skipChange = name => {
    const {permissions} = this.props
    const {range} = this.state
    return !checkPermissions(permissions, rangeRequiredRole(range), 'canvas', name)
  }

  handleOnClick = event => {
    const {onItemPicked} = this.props
    const {canvas} = this.state
    onItemPicked(canvas.id)
  }

  handleOnToggleClick = event => {
    const {updateCanvas} = this.props
    const {canvas} = this.state
    const {name, value, checked} = event.currentTarget
    if (this.skipChange(name)) {
      return
    }
    const {[name]: inputProcessor = (value, checked) => value} = fieldInputProcessors
    const currentValue = canvas[name]
    const processedValue = inputProcessor(value, !currentValue)
    updateCanvas(canvas.id, {[name]: processedValue})
  }

  handleOnInspectOpen = event => {
    this.setState({inspectDialogOpen: true})
  }

  handleOnInspectClose = event => {
    this.setState({inspectDialogOpen: false})
    this.props.onInspectClose()
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
    const {range, deleteRangePoint} = this.props
    const {canvas} = this.state
    if (this.skipChange('override')) {
      return
    }
    deleteRangePoint(range.get('id'), canvas.id, {sourceId: 'web'})
  }

  render() {
    const {className, readOnly, classes, connectDragSource, isDraggable, isDragging, points, selected, onCanvasNext, range, canvasPoint, permissions} = this.props
    const {inspectDialogOpen, infoDialogOpen, canvas, image} = this.state
    if (!image) {
      return <div/>
    }
    const wantedClasses = {
      [classes.root]: true,
      [classes.readOnly]: readOnly,
      [classes.selected]: selected,
      [classes.range]: !!range,
      [classes.override]: canvasHasOverride(canvas),
      [classes.exclude]: canvas.exclude,
      [classes.hole]: canvas.hole,
      [classes.isDraggable]: isDraggable,
      [classes.isDragging]: isDragging,
    }
    const result = <div className={classnames(wantedClasses, className)} onWheel={readOnly ? null : this.handleOnWheel}>
       <div className={classes.draggingOverlay}/>
      <div className={classes.excludeTopLeft} onClick={this.handleOnClick}/>
      <div className={classes.excludeBottomLeft} onClick={this.handleOnClick}/>
      <CanvasImage className={classes.card} canvas={canvas} canvasPoint={canvasPoint} onClick={this.handleOnClick}/>
      <div className={classes.upperLeft}>
        <div className={classes.upperLeftContent}>
          <Button className={classnames(classes.upperLeftItem, classes.excludeButton, this.skipChange('exclude') && classes.hidden)} mini variant='fab' name='exclude' onClick={this.handleOnToggleClick}><BlockIcon titleAccess='Exclude' className={classes.excludeIcon}/></Button>
          <Button className={classnames(classes.upperLeftItem, classes.holeButton, this.skipChange('hole') && classes.hidden)} mini variant='fab' name='hole' onClick={this.handleOnToggleClick}><LocationDisabledIcon titleAccess='Hole' className={classes.holeIcon}/></Button>
          <Button className={classnames(classes.upperLeftItem, classes.overrideButton, this.skipChange('override') && classes.hidden)} mini variant='fab' name='override' onClick={this.handleRemoveOverride}><PlaceIcon titleAccess='Override' className={classes.overrideIcon}/></Button>
        </div>
      </div>
      <div className={classes.upperRight}>
        <div className={classes.upperRightContent}>
          <CanvasStreetView className={classnames(classes.upperRightItem, classes.streetViewButton)} mini variant='fab' canvas={canvas}><StreetviewIcon titleAccess='Street View'/></CanvasStreetView>
        </div>
      </div>
      <div className={classes.lowerLeft}>
        <div className={classes.lowerLeftContent}>
          <Button className={classnames(classes.lowerLeftItem, classes.infoButton)} mini variant='fab' name='info' onClick={this.handleOnOpenDialog}><InfoIcon titleAccess='Info' className={classes.infoIcon}/></Button>
          <Button className={classnames(classes.lowerLeftItem, classes.linkButton)} mini variant='fab' name='link' component={Link} replace to={`/iiif?externalId=${encodeURIComponent(canvas.externalId)}`} onClick={this.handleOnClick}><LinkIcon titleAccess='Link' className={classes.linkIcon}/></Button>
        </div>
      </div>
      <div className={classes.lowerRight}>
        <div className={classes.lowerRightContent}>
          <Button className={classnames(classes.lowerRightItem, classes.inspectButton)} mini variant='fab' name='inspect' onClick={this.handleOnInspectOpen}><ZoomInIcon titleAccess='Inspect' className={classes.inspectcon}/></Button>
        </div>
      </div>
      <CanvasInspectDialog name='inspect' onClose={this.handleOnInspectClose} open={inspectDialogOpen} canvas={canvas} onCanvasNext={onCanvasNext}/>
      <CanvasInfo name='info' onClose={this.handleOnCloseDialog} open={infoDialogOpen} canvas={canvas} canvasPoint={canvasPoint}/>
    </div>
    return isDraggable && !this.skipChange('override') ? connectDragSource(result) : result
  }
})

const canvasImageStyles = {
  root: {
    border: '4px solid transparent',
    '&> img': {
    },
    '&$loading': {
      backgroundColor: '#aaaaaa',
    },
  },
  loading: {},
}

const CanvasImage = flow(withStyles(canvasImageStyles))(class CanvasImage extends React.Component {
  static defaultProps = {
    onClick(event) {},
    onLoad(event) {},
    canvasPoint: {
      googleVision: {
        rgb: [0, 0, 0],
      },
    },
  }

  state = {
    loading: true,
  }

  handleOnLoad = event => {
    const {onLoad} = this.props
    onLoad(event)
    this.setState({loading: false})
  }

  handleOnClick = event => {
    const {onClick} = this.props
    onClick(event)
  }

  render() {
    const {className, classes, canvas, canvasPoint} = this.props
    const {
      googleVision: {
        rgb: [
          red = 0,
          green = 0,
          blue = 0,
        ] = [],
      } = {},
    } = canvasPoint

    return <Card className={classnames(classes.root, className)} style={{backgroundColor: `rgb(${red}, ${green}, ${blue})`}}>
      <img src={`${canvas.image}/full/400,/0/default.jpg`} onLoad={this.handleOnLoad} onClick={this.handleOnClick} />
    </Card>
  }
})

const canvasInfoStyles = {
}

export const CanvasInfo = flow(picked(['buildings']), withStyles(canvasInfoStyles))(class CanvasInfo extends React.Component {
  static defaultProps = {
    onClose(event, name) {},
    canvasPoint: {
      googleVision: {
        rgb: [0, 0, 0],
      },
      point: {
        coordinates: [],
      },
    },
  }

  state = {}
  static getDerivedStateFromProps = getDerivedStateFromProps

  handleOnClose = event => {
    this.props.onClose(event, this.props.name)
  }

  render() {
    const {name, className, classes, buildings, canvas: undefined, canvasPoint, ...props} = this.props
    const {canvas, image} = this.state
    const canvasLocation = canvasPoint && canvasPoint.point || {}
    const canvasBuildings = buildings ? (canvasPoint.buildings || []).map(id => buildings.get(id)) : []

    return <Dialog {...props} onClose={this.handleOnClose}>
      <DialogTitle>Canvas {canvas.label}</DialogTitle>
      <DialogContent>
        <CanvasImage className={classes.card} canvas={canvas} canvasPoint={canvasPoint}/>
        <List dense>
          <ListItem>
            <ListItemText primary={`${canvasPoint && canvasPoint['addr_number']} ${canvasPoint && canvasPoint['addr_fullname']} ${canvasPoint && canvasPoint['addr_zipcode']}`}/>
          </ListItem>
          <ListItem>
            <ListItemText inset={false} primary={<CanvasStreetView canvas={canvas}/>}/>
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
    return <CanvasCardBase {...this.props} readOnly={false} isDraggable={true}/>
  }
}

export class CanvasCardRO extends React.Component {
  render() {
    return <CanvasCardBase {...this.props} readOnly={true} isDraggable={false}/>
  }
}

const canvasStreetViewStyles = {
}

export const CanvasStreetView = flow(picked(['range']), withStyles(canvasStreetViewStyles))(class CanvasStreetView extends React.Component {
  static defaultProps = {
    onItemPicked(id) {},
  }

  state = {}

  static getDerivedStateFromProps(props, state) {
    const nextState = getDerivedStateFromProps(props, state)
    const {canvas} = nextState
    const {points} = props
    const rangePoint = points && canvas && points.get(canvas.id)
    return {
      ...nextState,
      rangePoint,
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
  exclude(value, checked) {
    return checked
  },
  hole(value, checked) {
    return checked
  },
}

export const CanvasForm = flow(userPicked('permissions'), withStyles(canvasFormStyles))(class CanvasForm extends AbstractForm {
  static modelName = 'canvas'
  static fieldInputProcessors = fieldInputProcessors
  static updaterName = 'updateCanvas'
  static complexFields = ['tags']
  static defaultProps = {
    updateCanvas(id, data) {},
    deleteCanvasPointOverride(id) {},
    onItemPicked(id) {},
  }

  state = {dialogOpen: false}

  handleOnCanvasNext = delta => {
    const {canvases, canvas, onItemPicked} = this.props
    onCanvasNext(delta, {canvases, canvas, onItemPicked})
  }

  handleOnWheel = createScrollHandler(delta => this.handleOnCanvasNext(delta))

  skipChangeParent = (name, value, checked) => {
    const {permissions, range} = this.props
    return !checkPermissions(permissions, rangeRequiredRole(range), 'canvas', name)
  }

  handleRemoveOverride = (event) => {
    if (this.skipChangeItem('override')) {
      return
    }
    const {canvas, range, deleteRangePoint} = this.props
    deleteRangePoint(range.id, canvas.id, {sourceId: 'web'})
  }

  handleClose = () => {
    this.setState({dialogOpen: false})
  }

  render() {
    const {className, classes, range, deleteRangePoint, canvases, canvas, points, updateCanvas, selected, onItemPicked} = this.props
    if (!canvas) return <div />
    const hasOverride = canvasHasOverride(canvas)
    const image = canvas.image
    const point = canvas.point
    const canvasPoint = points && points.get(canvas.id) || undefined
    const rootClasses = {
      [classes.root]: true,
      [classes.hidden]: !!!canvas,
      [classes.override]: hasOverride,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <CanvasCard range={range} deleteRangePoint={deleteRangePoint} updateCanvas={updateCanvas} canvases={canvases} canvas={canvas} canvasPoint={canvasPoint} className={classes.card} onItemPicked={onItemPicked} onCanvasNext={this.handleOnCanvasNext}/>
      {point}
      <Typography>{canvasPoint && canvasPoint['addr_number']} {canvasPoint && canvasPoint['addr_fullname']} {canvasPoint && canvasPoint['addr_zipcode']}</Typography>
      <FormGroup row>
        <FormControlLabel label='Exclude' control={
          <Checkbox name='exclude' checked={!!this.checkOverrideValueDefault('exclude', false)} onChange={this.handleInputChange}/>
        }/>
        <FormControlLabel label='Hole' control={
          <Checkbox name='hole' checked={!!this.checkOverrideValueDefault('hole', false)} onChange={this.handleInputChange}/>
        }/>
        <FormControlLabel label='Override' control={
          <Checkbox name='override' disabled={!hasOverride} checked={!!hasOverride} onChange={this.handleRemoveOverride}/>
        }/>
      </FormGroup>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault('notes', '')} multiline={true} rows={3} onChange={this.handleInputChange}/>
      <IIIFTagEditor name='tags' modelName='canvas' suggestions={canvasTagSuggestions} value={this.checkOverrideValueDefault('tags', [])} onChange={this.handleInputChange}/>
    </Paper>
  }
})

const canvasInspectDialogStyles = {
}

export const CanvasInspectDialog = withStyles(canvasInspectDialogStyles)(class CanvasInspectDialog extends React.Component {
  static defaultProps = {
    onCanvasNext(delta) {},
    onClose() {},
    open: false,
  }

  static getDerivedStateFromProps(props, state) {
    const {open} = props
    const {propOpen, stateOpen} = state
    return {
      propOpen: open,
      stateOpen: open !== propOpen ? open : stateOpen,
    }
  }

  state = {
    propOpen: false,
    stateOpen: false,
  }

  handleOnCanvasNext = delta => this.props.onCanvasNext(delta)

  handleClose = () => {
    this.setState({stateOpen: false})
    this.props.onClose()
  }

  render() {
    const {canvas} = this.props
    const {stateOpen} = this.state
    return <Dialog
      keepMounted={true}
      fullScreen
      open={stateOpen}
      onClose={this.handleClose}
    >
      <AppBar style={{position: 'relative'}}>
        <IconButton color="inherit" onClick={this.handleClose} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </AppBar>
      {stateOpen ? <CanvasLeaflet canvas={canvas} onCanvasNext={this.handleOnCanvasNext} /> : null}
    </Dialog>
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
      {canvases.map(canvas => {
        const canvasPoint = points && points.get(canvas.id) || undefined
        return <CanvasCard range={range} deleteRangePoint={deleteRangePoint} updateCanvas={updateCanvas} key={canvas.id} canvas={canvas} canvasPoint={canvasPoint} className={classes.card} selected={selected === canvas.id} onItemPicked={onItemPicked}/>
      })}
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
    '& $handleCurrent$handleNeedsReview': {
      borderColor:['white', '!important'],
    },
    '& $handleCurrent$handleOverride': {
      borderColor:['white', '!important'],
    },
    '& $handleCurrent$handleExclude': {
      borderColor:['white', '!important'],
    },
    '& $handleOverride': {
      backgroundColor:'green',
      borderColor:'green',
    },
    '& $handleExclude': {
      backgroundColor:'black',
      borderColor: 'black',
    },
    '& $handleNeedsReview': {
      backgroundColor:'red',
      borderColor:'red',
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
    '& $cardLowerRightContent': {
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
    '& $cardLowerRightContent': {
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
    '& $cardLowerRightContent': {
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
    '& $cardLowerRightContent': {
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
    '& $cardLowerRightContent': {
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
  cardLowerRightContent: {
    transformOrigin: ['bottom', 'right'],
  },
  handleDefault: {
  },
  handleCurrent: {
  },
  handleNeedsReview: {
  },
  handleOverride: {
  },
  handleExclude: {
  },
}

export const CanvasSlidingList = flow(picked(['range', 'canvas']), withStyles(canvasSlidingListStyles))(class CanvasSlidingList extends React.Component {
  static getDerivedStateFromProps(props, state) {
    const {canvas, canvases, classes} = props
    if (!!!canvases || (canvas === state.canvas && canvases === state.canvases && classes === state.classes)) {
      return {}
    }
    const position = canvases.findIndex(item => item === canvas)
    const handles = canvases.map((item, index) => {
      if (!item) {
        return
      }
      const hasOverrides = item.get('overrides')
      const isExcluded = item.get('exclude')
      const isCurrent = item === canvas
      const tags = item.get('tags', immutableEmptyList)
      const needsReview = tags.find(tag => tag === 'Needs Review')
      const wantedClasses = {
        [classes.handleDefault]: true,
        [classes.handleOverride]: hasOverrides,
        [classes.handleExclude]: isExcluded,
        [classes.handleCurrent]: isCurrent,
        [classes.handleNeedsReview]: needsReview,
      }
      const result = {
        value: index,
        readOnly: !isCurrent,
        className: classnames(wantedClasses),
      }
      return needsReview || hasOverrides || isExcluded || isCurrent ? result : null
    }).filter(item => item).sort((a, b) => {
      if (a.readOnly === false) {
        return -1
      } else if (b.readOnly === false) {
        return 1
      } else {
        return a.value - b.value
      }
    }).toJSON()
    return {canvases, classes, handles, position}
  }

  state = {
    canvasInspectDelta: 0,
  }

  handleOnReliderChange = (handles) => {
    const {onItemPicked, canvases} = this.props
    const {value: position} = handles.find(handle => !handle.readOnly)
    const canvas = canvases.get(position)
    onItemPicked(canvas.get('id'))
  }

  handleOnWheel = createScrollHandler(delta => {
    const {canvases, canvas, onItemPicked} = this.props
    onCanvasNext(delta, {canvases, canvas, onItemPicked})
  })

  handleOnInspectClose = () => {
    this.setState({canvasInspectDelta: 0})
  }

  handleOnCanvasNext = delta => {
    this.setState({canvasInspectDelta: this.state.canvasInspectDelta + delta})
  }

  render() {
    const {className, classes, range, deleteRangePoint, updateCanvas, canvases, canvas, points, onItemPicked} = this.props
    if (!!!canvases) return <div/>
    const {handles, position, canvasInspectDelta} = this.state
    if (position === -1) return <div/>

    const pickCanvas = offset => {
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
            lowerRightContent: classes.cardLowerRightContent,
          }
          const canvasPoint = points && points.get(id) || undefined
          return <div key={`canvas-${id}`} className={className}><CanvasCard range={range} deleteRangePoint={deleteRangePoint} updateCanvas={updateCanvas} classes={cardClasses} canvas={item} canvasPoint={canvasPoint} selected={item === canvas} onItemPicked={onItemPicked} onCanvasNext={this.handleOnCanvasNext} onInspectClose={this.handleOnInspectClose}/></div>
        } else {
          return <div key={`not-loaded-${index}`} className={className}>[canvas-not-loaded{offset}:{index}]</div>
        }
      } else {
        return <div key={`missing-${offset}`}/>
      }
    }

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
          handles={handles}
          onChange={this.handleOnReliderChange}
        />
      </div>
      {cells}
    </div>
  }
})

export const CanvasPanel = picked(['range', 'canvas'])(class CanvasPanel extends React.Component {
  state = {}

  static getDerivedStateFromProps = getDerivedStateFromProps

  render() {
    const {className, canvases, updateCanvas, deleteCanvasPointOverride, onItemPicked, deleteRangePoint, ...props} = this.props
    const {range, canvas} = this.state

    if (!range) return <div/>
    const title = canvas ? canvas.label : 'Canvas'
    const image = canvas && canvas.image
    const lastImagePart = image && image.replace(/%2F/g, '/').replace(/.*\//, '')
    return <ItemPanel
      className={className}
      name='canvas'
      title={`${lastImagePart} ${title}`}
      icon={<ImageIcon/>}
      form={<CanvasForm range={range} canvases={canvases} canvas={canvas} updateCanvas={updateCanvas} deleteCanvasPointOverride={deleteCanvasPointOverride} onItemPicked={onItemPicked} deleteRangePoint={deleteRangePoint}/>}
      busy={canvas && canvas._busy}
    />
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

