import {fromJS, Map as imMap} from 'immutable'
import flow from 'lodash-es/flow'
import React from 'react'
import ImmutablePropTypes from 'react-immutable-proptypes'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'
import Fab from '@material-ui/core/Fab'
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
import Taxdata from '../Taxdata'
import GoogleVision from '../GoogleVision'
import * as iiifRedux from './redux'
import { byId, global, picked } from './Picked'
import IIIFTagEditor, {commonTagDefinitions} from './Tags'
import {immutableEmptyList, immutableEmptyMap} from '../constants'

import { makeUrl } from '../api'
import {createScrollHandler} from '../ScrollHelper'
import {checkPermission, picked as userPicked} from '../User'
import { CollectionTitle } from './Collection'
import { ManifestTitle } from './Manifest'
import { RangeTitle, rangeRequiredRole } from './Range'
import { AbstractForm } from './base'
import { CanvasStatusShape, CanvasShape, CanvasesShape } from './Types'

export function handleCanvasNext(event, onCanvasNext) {
  const {deltaX, deltaY, deltaZ, deltaMode} = event
  const delta = deltaX === 0 ? deltaY : deltaX
  if (delta === 0) {
    return
  }
  event.preventDefault()
  onCanvasNext(delta)
}

export function onCanvasNext(delta, {canvasList, canvas, onItemPicked}) {
  if (!!!canvasList) return
  const canvasId = canvas.get('id')
  const position = canvasList.findIndex(item => ('' + item) === ('' + canvasId))
  if (position === -1) return
  const nextPosition = position + Math.sign(delta)
  if (nextPosition >= 0 && nextPosition < canvasList.size) {
    const newCanvasId = canvasList.get(nextPosition)
    onItemPicked(newCanvasId)
  }
}
export function handleCanvasWheel({event, ...context}) {
  return handleCanvasNext(event, delta => onCanvasNext(delta, context))
}

function getDerivedStateFromProps(props, state = {}) {
  const {canvas} = props
  const image = canvas ? canvas.get('image', null) : null
  return {
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
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto',
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
  const overrides = canvas.get('overrides')
  return overrides && !!overrides.find(override => override.get('point'))
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
  static propTypes = {
    canvas: CanvasShape,
  }

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
    const {canvas, canvasList, onItemPicked} = this.props
    onCanvasNext(delta, {canvas, canvasList, onItemPicked})
  })

  skipChange = name => {
    const {permissions, range} = this.props
    return !checkPermission(permissions, rangeRequiredRole(range), 'canvas', name)
  }

  handleOnClick = event => {
    const {canvas, onItemPicked} = this.props
    onItemPicked(canvas.get('id'))
  }

  handleOnToggleClick = event => {
    const {canvas, updateCanvas} = this.props
    const {name, value, checked} = event.currentTarget
    if (this.skipChange(name)) {
      return
    }
    const {[name]: inputProcessor = (value, checked) => value} = fieldInputProcessors
    const currentValue = canvas.get(name)
    const processedValue = inputProcessor(value, !currentValue)
    updateCanvas(canvas.get('id'), {[name]: processedValue})
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
    const {canvas, range, deleteRangePoint} = this.props
    if (this.skipChange('override')) {
      return
    }
    deleteRangePoint(range.get('id'), canvas.get('id'), {sourceId: 'web'})
  }

  render() {
    const {className, readOnly, classes, connectDragSource, isDraggable, isDragging, points, selected, onCanvasNext, collectionId, manifestId, range, canvas, canvasPoint, permissions} = this.props
    const {inspectDialogOpen, infoDialogOpen, image} = this.state
    if (!image) {
      return <div/>
    }
    const wantedClasses = {
      [classes.root]: true,
      [classes.readOnly]: readOnly,
      [classes.selected]: selected,
      [classes.range]: !!range,
      [classes.override]: canvasHasOverride(canvas),
      [classes.exclude]: canvas.get('exclude'),
      [classes.hole]: canvas.get('hole'),
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
          <Fab className={classnames(classes.upperLeftItem, classes.excludeButton, this.skipChange('exclude') && classes.hidden)} size='small' name='exclude' onClick={this.handleOnToggleClick}><BlockIcon titleAccess='Exclude' className={classes.excludeIcon}/></Fab>
          <Fab className={classnames(classes.upperLeftItem, classes.holeButton, this.skipChange('hole') && classes.hidden)} size='small' name='hole' onClick={this.handleOnToggleClick}><LocationDisabledIcon titleAccess='Hole' className={classes.holeIcon}/></Fab>
          <Fab className={classnames(classes.upperLeftItem, classes.overrideButton, this.skipChange('override') && classes.hidden)} size='small' name='override' onClick={this.handleRemoveOverride}><PlaceIcon titleAccess='Override' className={classes.overrideIcon}/></Fab>
        </div>
      </div>
      <div className={classes.upperRight}>
        <div className={classes.upperRightContent}>
          <CanvasStreetView className={classnames(classes.upperRightItem, classes.streetViewButton)} Component={Fab} size='small' canvas={canvas}><StreetviewIcon titleAccess='Street View'/></CanvasStreetView>
        </div>
      </div>
      <div className={classes.lowerLeft}>
        <div className={classes.lowerLeftContent}>
          <Fab className={classnames(classes.lowerLeftItem, classes.infoButton)} size='small' name='info' onClick={this.handleOnOpenDialog}><InfoIcon titleAccess='Info' className={classes.infoIcon}/></Fab>
          <Fab className={classnames(classes.lowerLeftItem, classes.linkButton)} size='small' name='link' component={Link} replace to={`/iiif?externalId=${encodeURIComponent(canvas.get('externalId'))}`} onClick={this.handleOnClick}><LinkIcon titleAccess='Link' className={classes.linkIcon}/></Fab>
        </div>
      </div>
      <div className={classes.lowerRight}>
        <div className={classes.lowerRightContent}>
          <Fab className={classnames(classes.lowerRightItem, classes.inspectButton)} size='small' name='inspect' onClick={this.handleOnInspectOpen}><ZoomInIcon titleAccess='Inspect' className={classes.inspectcon}/></Fab>
        </div>
      </div>
      <CanvasInspectDialog name='inspect' onClose={this.handleOnInspectClose} open={inspectDialogOpen} canvas={canvas} onCanvasNext={onCanvasNext}/>
      <CanvasInfo name='info' onClose={this.handleOnCloseDialog} open={infoDialogOpen} collectionId={collectionId} manifestId={manifestId} range={range} canvas={canvas} canvasPoint={canvasPoint} permissions={permissions}/>
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
    const googleVision = canvas.getIn(['googleVision', 'rgb'], immutableEmptyList).toJS()
    const [red = 0, green = 0, blue = 0] = googleVision

    return <Card className={classnames(classes.root, className)} style={{backgroundColor: `rgb(${red}, ${green}, ${blue})`}}>
      <img src={`${canvas.get('image')}/full/400,/0/default.jpg`} onLoad={this.handleOnLoad} onClick={this.handleOnClick} />
    </Card>
  }
})

const canvasInfoStyles = {
}

const TaxdataShape = ImmutablePropTypes.mapContains({
  ain: PropTypes.string,
})

export const CanvasInfo = flow(picked(['buildings']), byId('collection', 'manifest'), withStyles(canvasInfoStyles))(class CanvasInfo extends React.Component {
  static propTypes = {
    canvasPoint: ImmutablePropTypes.mapContains({
      addr_number: PropTypes.string,
      addr_fullname: PropTypes.string,
      addr_zipcode: PropTypes.string,
      buildings: ImmutablePropTypes.listOf(PropTypes.any),
      point: ImmutablePropTypes.mapContains({
        coordinates: ImmutablePropTypes.listOf(PropTypes.number),
      }),
    }),
  }

  static defaultProps = {
    onClose(event, name) {},
    canvasPoint: fromJS({
      buildings: [],
      point: {
        coordinates: [],
      },
    }),
  }

  state = {}
  static getDerivedStateFromProps = getDerivedStateFromProps

  handleOnClose = event => {
    this.props.onClose(event, this.props.name)
  }

  render() {
    const {name, className, classes, buildings, collection, collectionId, manifest, manifestId, range, canvas, canvasPoint, permissions, ...props} = this.props
    const {image} = this.state
    const canvasLocation = canvasPoint.get('point', immutableEmptyMap)
    const canvasBuildingList = canvasPoint.get('buildings') || immutableEmptyList
    if (!canvasBuildingList) {
      debugger
    }
    const canvasBuildings = buildings ? canvasBuildingList.map(id => buildings.get(id)) : immutableEmptyList

    const taxdatas = canvasBuildings.filter(building => building && building.get('taxdata')).map(building => building.get('taxdata')).reduce((taxdatas, taxdata) => {
      taxdatas[taxdata.get('ain')] = taxdata
      return taxdatas
    }, {})

    return <Dialog {...props} onClose={this.handleOnClose}>
      <DialogTitle>
        <CollectionTitle collection={collection}/>
        <ManifestTitle manifest={manifest}/>
        <RangeTitle range={range}/>
        <CanvasTitle canvas={canvas}/>
      </DialogTitle>
      <DialogContent>
        <CanvasImage className={classes.card} canvas={canvas} canvasPoint={canvasPoint}/>
        {range && checkPermission(permissions, null, 'canvas', 'get_json') ? <Button fullWidth variant='contained' target='blank' href={makeUrl('api', `range/${range.get('id')}/json/${canvas.get('id')}`)}>Get Raw JSON</Button> : null}
        <List dense>
          <ListItem disableGutters>
            <ListItemText primary={`${canvasPoint.get('addr_number')} ${canvasPoint.get('addr_fullname')} ${canvasPoint.get('addr_zipcode')}`}/>
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary={<CanvasStreetView canvas={canvas}/>}/>
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary={`
            Lat: ${canvasLocation.getIn(['coordinates', 1])}
            Long: ${canvasLocation.getIn(['coordinates', 0])}
            `}/>
          </ListItem>
          <GoogleVision googleVision={canvas.get('googleVision')}/>
          <ListItem disableGutters>
            <ListItemText primary='Tax Lots'/>
          </ListItem>
            {Object.values(taxdatas).map(taxdata => <Taxdata key={taxdata.get('ain')} taxdata={taxdata}/>)}
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
    const {canvas} = this.props
    if (!canvas) return <div/>
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
  static propTypes = {
    canvas: PropTypes.object,
    points: ImmutablePropTypes.mapOf(
      ImmutablePropTypes.mapContains({
        latlng: ImmutablePropTypes.map.isRequired,
        bearing: PropTypes.number.isRequired,
      }),
      PropTypes.number
    ),
  }

  render() {
    const {buildings, range, points, canvas, updateOwner, updateRange, onItemPicked, rangeStatus, ...props} = this.props

    const rangePoint = points && canvas ? points.get(canvas.get('id')) : undefined
    if (!rangePoint) {
      return <div/>
    }
    const fovOrientation = range.get('fovOrientation', 'left')
    return <GoogleStreetView {...props} location={rangePoint.get('latlng')} heading={rangePoint.get('bearing') + (fovOrientation === 'left' ? -90 : 90)}/>
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

export const CanvasForm = flow(withStyles(canvasFormStyles))(class CanvasForm extends AbstractForm {
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
    const {canvasList, canvas, onItemPicked} = this.props
    onCanvasNext(delta, {canvasList, canvas, onItemPicked})
  }

  handleOnWheel = createScrollHandler(delta => this.handleOnCanvasNext(delta))

  skipChangeParent = (name, value, checked) => {
    const {permissions, range} = this.props
    return !checkPermission(permissions, rangeRequiredRole(range), 'canvas', name)
  }

  handleRemoveOverride = (event) => {
    if (this.skipChangeItem('override')) {
      return
    }
    const {canvas, range, deleteRangePoint} = this.props
    deleteRangePoint(range.get('id'), canvas.get('id'), {sourceId: 'web'})
  }

  handleClose = () => {
    this.setState({dialogOpen: false})
  }

  render() {
    const {className, classes, range, deleteRangePoint, canvas, points, updateCanvas, selected, onItemPicked} = this.props
    if (!canvas) return <div />
    const hasOverride = canvasHasOverride(canvas)
    const image = canvas.get('image')
    const point = canvas.get('point')
    const canvasPoint = points && points.get(canvas.id) || undefined
    const rootClasses = {
      [classes.root]: true,
      [classes.hidden]: !!!canvas,
      [classes.override]: hasOverride,
    }

    return <Paper className={classnames(rootClasses, className)}>
      {point}
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
      <IIIFTagEditor name='tags' modelName='canvas' suggestions={canvasTagSuggestions} value={this.checkOverrideValueDefault('tags', immutableEmptyList)} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export class CanvasTitle extends React.Component {
  render() {
    const {className, canvas} = this.props
    const title = canvas ? canvas.get('label') : 'Canvas'
    const image = canvas && canvas.get('image')
    const lastImagePart = image && image.replace(/%2F/g, '/').replace(/.*\//, '')

    return <Typography variant='body1' classes={{body1: className}}>{`${lastImagePart} ${title}`}</Typography>
  }
}

const canvasBriefStyles = {
  root: {},
  hidden: {},
  override: {},
  card: {},
}

export const CanvasBrief = withStyles(canvasBriefStyles)(class CanvasBrief extends React.Component {
  static defaultProps = {
    points: immutableEmptyMap,
  }

  handleOnCanvasNext = delta => {
    const {canvasList, canvas, onItemPicked} = this.props
    onCanvasNext(delta, {canvasList, canvas, onItemPicked})
  }

  render() {
    const {className, classes, collectionId, manifestId, range, canvasList, canvasMap, canvas, points, deleteRangePoint} = this.props
    if (!canvas) return <div/>
    const hasOverride = canvasHasOverride(canvas)
    const image = canvas.get('image')
    const point = canvas.get('point')
    const canvasPoint = points.get(canvas.get('id'), immutableEmptyMap)
    const rootClasses = {
      [classes.root]: true,
      [classes.hidden]: !!!canvas,
      [classes.override]: hasOverride,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <CanvasTitle canvas={canvas}/>
      <CanvasCard collectionId={collectionId} manifestId={manifestId} range={range} canvasList={canvasList} canvasMap={canvasMap} canvas={canvas} canvasPoint={canvasPoint} className={classes.card} onCanvasNext={this.handleOnCanvasNext} deleteRangePoint={deleteRangePoint}/>
      {point}
      <Typography>{canvasPoint.get('addr_number')} {canvasPoint.get('addr_fullname')} {canvasPoint.get('addr_zipcode')}</Typography>
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
    '& $cardUpperLeft': {
    },
    '& $cardUpperRight': {
    },
    '& $cardLowerLeft': {
    },
    '& $cardLowerRight': {
    },
  },
  container1: {
    display: 'inline-block',
    width: '15%',
    overflow: 'hidden',
    '& $cardUpperLeft': {
      transform: 'scale(0.85)',
    },
    '& $cardUpperRight': {
      transform: 'scale(0.85)',
    },
    '& $cardLowerLeft': {
      transform: 'scale(0.85)',
    },
    '& $cardLowerRight': {
      transform: 'scale(0.85)',
    },
  },
  container2: {
    display: 'inline-block',
    width: '11%',
    overflow: 'hidden',
    '& $cardUpperLeft': {
      transform: 'scale(0.70)',
    },
    '& $cardUpperRight': {
      transform: 'scale(0.70)',
    },
    '& $cardLowerLeft': {
      transform: 'scale(0.70)',
    },
    '& $cardLowerRight': {
      transform: 'scale(0.70)',
    },
  },
  container3: {
    display: 'inline-block',
    width: '8%',
    overflow: 'hidden',
    '& $cardUpperLeft': {
      transform: 'scale(0.60)',
    },
    '& $cardUpperRight': {
      transform: 'scale(0.60)',
    },
    '& $cardLowerLeft': {
      transform: 'scale(0.60)',
    },
    '& $cardLowerRight': {
      transform: 'scale(0.60)',
    },
  },
  container4: {
    display: 'inline-block',
    width: '6%',
    overflow: 'hidden',
    '& $cardUpperLeft': {
      transform: 'scale(0.50)',
      display: 'none',
    },
    '& $cardUpperRight': {
      transform: 'scale(0.50)',
      display: 'none',
    },
    '& $cardLowerLeft': {
      transform: 'scale(0.50)',
      display: 'none',
    },
    '& $cardLowerRight': {
      transform: 'scale(0.50)',
      display: 'none',
    },
  },
  cardUpperLeft: {
    transformOrigin: ['top', 'left'],
  },
  cardUpperRight: {
    transformOrigin: ['top', 'right'],
  },
  cardLowerLeft: {
    transformOrigin: ['bottom', 'left'],
  },
  cardLowerRight: {
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

export const CanvasSlidingList = flow(picked(['range', 'canvas']), byId('collectionId', 'manifestId'), withStyles(canvasSlidingListStyles))(class CanvasSlidingList extends React.Component {
  static getDerivedStateFromProps(props, state) {
    const {range, canvas, canvases, classes} = props
    let canvasList = range ? range.get('canvases') : undefined
    if (!!!range || !canvasList || (canvas === state.canvas && range === state.range && classes === state.classes)) {
      return {}
    }
    const canvasId = canvas ? canvas.get('id') : undefined
    if (range.get('reverse', false)) {
      canvasList = canvasList.reverse()
    }
    const position = !canvas ? -1 : canvasList.findIndex(rangeCanvasId => rangeCanvasId === canvasId)
    const handles = canvasList.map((canvasId, index) => {
      const rangeCanvas = canvases.get(canvasId)
      if (!rangeCanvas) {
        return
      }
      const hasOverrides = rangeCanvas.get('overrides')
      const isExcluded = rangeCanvas.get('exclude')
      const isCurrent = rangeCanvas === canvas
      const tags = rangeCanvas.get('tags', immutableEmptyList)
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
    }).filter(rangeCanvas => rangeCanvas).sort((a, b) => {
      if (a.readOnly === false) {
        return -1
      } else if (b.readOnly === false) {
        return 1
      } else {
        return a.value - b.value
      }
    }).toJSON()
    const cardClasses = {
      upperLeft: classes.cardUpperLeft,
      upperRight: classes.cardUpperRight,
      lowerLeft: classes.cardLowerLeft,
      lowerRight: classes.cardLowerRight,
    }
    return {range, canvas, classes, handles, position, cardClasses}
  }

  state = {
    canvasInspectDelta: 0,
  }

  handleOnReliderChange = (handles) => {
    const {onItemPicked, range} = this.props
    const {value: position} = handles.find(handle => !handle.readOnly)
    const canvasId = range.getIn(['canvases', position])
    onItemPicked(canvasId)
  }

  handleOnWheel = createScrollHandler(delta => {
    const {range, canvas, onItemPicked} = this.props
    const canvasList = range.get('canvases')
    onCanvasNext(delta, {canvasList, canvas, onItemPicked})
  })

  handleOnInspectClose = () => {
    this.setState({canvasInspectDelta: 0})
  }

  handleOnCanvasNext = delta => {
    this.setState({canvasInspectDelta: this.state.canvasInspectDelta + delta})
  }

  render() {
    const {className, classes, collectionId, manifestId, range, canvases, deleteRangePoint, updateCanvas, canvas, points, onItemPicked} = this.props
    if (!!!range || !!!canvases) return <div/>
    const canvasList = range.get('canvases')
    if (!!!canvasList) return <div/>
    const {handles, position, canvasInspectDelta, cardClasses} = this.state
    if (position === -1) return <div/>

    const pickCanvas = offset => {
      const absOffset = Math.abs(offset)
      const index = position + offset
      const className = classes[`container${absOffset}`]
      if (index < 0) {
        return <div key={`in-${absOffset}`} className={className}/>
      } else if (index >= canvasList.size) {
        return <div key={`out-${absOffset}`} className={className}/>
      } else if (canvasList) {
        const item = canvases.get(canvasList.get(index))
        if (item) {
          const id = item.get('id')
          const canvasPoint = points && points.get(id) || undefined
          return <div key={`canvas-${id}`} className={className}>
            <CanvasCard collectionId={collectionId} manifestId={manifestId} range={range} deleteRangePoint={deleteRangePoint} updateCanvas={updateCanvas} classes={cardClasses} canvas={item} canvasPoint={canvasPoint} selected={item === canvas} onItemPicked={onItemPicked} onCanvasNext={this.handleOnCanvasNext} onInspectClose={this.handleOnInspectClose}/>
            </div>
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
          max={canvasList.size - 1}
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

export const CanvasPanel = flow(picked(['collection', 'manifest', 'range', 'canvas']), userPicked('permissions'))(class CanvasPanel extends React.Component {
  state = {}

  static getDerivedStateFromProps = getDerivedStateFromProps

  render() {
    const {className, canvases, canvasStatus, updateCanvas, deleteCanvasPointOverride, onItemPicked, deleteRangePoint, points, permissions, ...props} = this.props
    const {collection, manifest, range, canvas} = this.props

    if (!collection || !manifest || !range) return <div/>
    const canvasList = range.get('canvases')
    return <ItemPanel
      className={className}
      name='canvas'
      title={<CanvasTitle canvas={canvas}/>}
      brief={<CanvasBrief collectionId={collection.get('id', null)} manifestId={manifest.get('id', null)} range={range} canvasList={canvasList} canvasMap={canvases} canvas={canvas} points={points} onItemPicked={onItemPicked} deleteRangePoint={deleteRangePoint} />}
      icon={<ImageIcon/>}
      showForm={checkPermission(permissions, null, 'canvas', 'form')}
      form={<CanvasForm permissions={permissions} range={range} canvasList={canvasList} canvasMap={canvases} canvas={canvas} updateCanvas={updateCanvas} deleteCanvasPointOverride={deleteCanvasPointOverride} onItemPicked={onItemPicked} deleteRangePoint={deleteRangePoint} points={points}/>}
      busy={canvasStatus.get('busy')}
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

