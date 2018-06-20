import _ from 'lodash'
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


import CanvasLeaflet from './CanvasLeaflet'
import classnames from 'classnames'
import Relider from 'relider'

import connectHelper from '../connectHelper'
import * as iiifRedux from './redux'
import {picked} from './Picked'

const canvasCardStyles = {
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
}

const canvasHasOverride = canvas => {
  if (canvas) {
    const overrides = canvas.get('overrides')
    return overrides && !!overrides.find(override => override.get('point'))
  }
  return false
}

export const CanvasCard = withStyles(canvasCardStyles)(class CanvasCard extends React.Component {
  static defaultProps = {
    onItemPicked(id) {},
  }

  handleOnClick = event => {
    const {canvas, onItemPicked} = this.props
    onItemPicked(canvas.get("id"))
  }

  render() {
    const {className, classes, canvas, selected} = this.props
    const thumbnail = canvas ? canvas.get('thumbnail') : null
    if (!thumbnail) {
      return <div/>
    }
    const wantedClasses = {
      [classes.root]: true,
      [classes.selected]: selected,
      [classes.override]: canvasHasOverride(canvas),
      [classes.exclude]: canvas.get('exclude'),
    }
    return <div className={classnames(wantedClasses, className)}>
      <div className={classes.excludeTopLeft} onClick={this.handleOnClick}/>
      <div className={classes.excludeBottomLeft} onClick={this.handleOnClick}/>
      <Card className={classes.card} onClick={this.handleOnClick}>
        <img src={`${thumbnail}/full/full/0/default.jpg`}/>
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

export const CanvasForm = _.flow(picked(['range', 'canvas']), withStyles(canvasFormStyles))(class CanvasForm extends React.Component {
  static defaultProps = {
    updateCanvas(id, data) {},
    deleteCanvasPointOverride(id) {},
  }

  constructor(props) {
    super(props)
    this.state = {dialogOpen: false}
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
    const {className, classes, canvas, selected} = this.props
    if (!canvas) return <div />
    const image = canvas.get('image')
    const rootClasses = {
      [classes.root]: true,
      [classes.hidden]: !!!canvas,
      [classes.override]: canvasHasOverride(canvas),
    }

    return <Paper className={classnames(rootClasses, className)}>
      <CanvasCard canvas={canvas} className={classes.card}/>
      <Dialog
        fullScreen
        open={this.state.dialogOpen}
        onClose={() => this.handleClose()}
      >
        <AppBar style={{position: 'relative'}}>
          <IconButton color="inherit" onClick={() => this.handleClose()} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </AppBar>
        <CanvasLeaflet url={image ? image + '/' : 'http://foo'} />
      </Dialog>
      <Button fullWidth variant='raised' onClick={this.largePhotoView}>Inspect</Button>
      <Button name='override' fullWidth variant='raised' className={classes.removeOverride} onClick={this.handleRemoveOverride}>
        Remove Override
      </Button>
      <FormGroup row>
        <FormControlLabel label='Exclude' control={
          <Checkbox name='exclude' checked={!!canvas.get('exclude')} onChange={this.handleInputChange}/>
        }/>
        <FormControlLabel label='Hole' control={
          <Checkbox name='hole' checked={!!canvas.get('hole')} onChange={this.handleInputChange}/>
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
      {canvases.map(canvas => <CanvasCard key={canvas.id} selected={selected === canvas.id} canvas={canvas} onItemPicked={onItemPicked}/>)}
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
      {canvases.map(canvas => <CanvasCard key={canvas.id} canvas={canvas} className={classes.card} selected={selected === canvas.id} onItemPicked={onItemPicked}/>)}
    </div>
  }
})

const canvasSlidingListStyles = {
  root: {
    width: '100%',
    height: 108,
  },
  container: {
    display: 'inline-block',
    width: `${100 / 5}%`,
  },
}
export const CanvasSlidingList = _.flow(picked(['range', 'canvas']), withStyles(canvasSlidingListStyles))(class CanvasSlidingList extends React.Component {
  handleOnReliderChange = (handles) => {
    const {onItemPicked, canvases} = this.props
    const {value: position} = handles[0]
    const canvas = canvases.get(position)
    onItemPicked(canvas.get('id'))
  }

  render() {
    const {className, classes, canvases, canvas, onItemPicked} = this.props
    if (!!!canvases) return <div/>
    const position = canvases.findIndex(item => item === canvas)
    if (position === -1) return <div/>
    const slidingWindow = canvases.slice(Math.max(0, position - 2), Math.min(canvases.size, position + 3)).toArray()

    return <div className={classnames(classes.root, className)}>
      <div className={classes.relider}>
        <Relider
          onDragStop={this.handleOnDragStop}
          style={{width: '95%'}}
          sliderStyle={{marginBottom: 5, marginTop: 5, marginRight: 5, marginLeft: 5}}
          horizontal={true}
          reversed={false}
          min={0}
          max={canvases.size - 1}
          step={1}
          handles={[
            {value: position}
          ]}
          onChange={this.handleOnReliderChange}
        />
      </div>
      {Array.from(Array(Math.abs(Math.min(0, position - 2)))).map((value, index) => {
        return <div key={index} className={classes.container}>[lead-in-blank]</div>
      })}
      {slidingWindow.map((item, index) => {
        return <div key={index} className={classes.container}>
          {item ? <CanvasCard canvas={item} selected={item === canvas} onItemPicked={onItemPicked}/> : '[canvas-not-loaded]'}
        </div> 
      })}
      {Array.from(Array(Math.abs(Math.max(0, position - canvases.size + 3)))).map((value, index) => {
        return <div key={index} className={classes.container}>[lead-out-blank{index}]</div>
      })}
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

