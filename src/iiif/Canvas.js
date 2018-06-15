import _ from 'lodash'
import Immutable from 'immutable'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import List from '@material-ui/core/List'
import Card from '@material-ui/core/Card'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
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
    onSelect(id) {},
  }

  handleOnClick = event => {
    const {canvas, onSelect} = this.props
    onSelect(canvas.get("id"))
  }

  render() {
    const {className, classes, canvas, selected} = this.props
    if (!canvas) {
      return <div/>
    }
    const wantedClasses = {
      [classes.root]: true,
      [classes.selected]: selected,
      [classes.override]: canvasHasOverride(canvas),
    }
    return <div className={classnames(wantedClasses, className)}>
      <Card className={classes.card} onClick={this.handleOnClick}>
        <img src={`${canvas.get('thumbnail')}/full/full/0/default.jpg`}/>
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
}

export const CanvasForm = withStyles(canvasFormStyles)(class CanvasForm extends React.Component {
  static defaultProps = {
    updateCanvas(id, data) {},
    deleteCanvasPointOverride(id) {},
  }

  handleInputChange = event => {
    const {canvas, updateCanvas} = this.props
    const {name, value} = event.currentTarget
    const {[name]: inputProcessor = value => value} = fieldInputProcessors
    const processedValue = inputProcessor(value)
    const currentValue = canvas.get(name)
    if (currentValue !== processedValue) {
      updateCanvas(canvas.get('id'), {[name]: processedValue})
    }
  }

  handleRemoveOverride = (event) => {
    const {canvas, deleteCanvasPointOverride} = this.props
    deleteCanvasPointOverride(canvas.get('id'))
  }

  render() {
    const {className, classes, canvas, selected} = this.props
    const rootClasses = {
      [classes.root]: true,
      [classes.hidden]: !!!canvas,
      [classes.override]: canvasHasOverride(canvas),
    }

    return <Paper className={classnames(rootClasses, className)}>
      <Typography variant='headline'>Canvas</Typography>
      <CanvasCard canvas={canvas} className={classes.card}/>
      <Button name='override' fullWidth variant='raised' className={classes.removeOverride} onClick={this.handleRemoveOverride}>
        Remove Override
      </Button>
      <TextField name='notes' fullWidth label='Notes' multiline={true} rows={5} onChange={this.handleInputChange}/>
      <TextField name='tags' fullWidth label='Tags' value={canvas.get('tags', []).join("\n")} multiline={true} rows={5} onChange={this.handleInputChange}/>
    </Paper>
  }
})

const canvasGridStyles = {
  root: {
  },
}

export const CanvasGrid = withStyles(canvasGridStyles)(class CanvasGrid extends React.Component {
  render() {
    const {classes, className, canvases, selected, onSelect} = this.props
    return <GISGrid className={classnames(classes.root, className)}>
      {canvases.map(canvas => <CanvasCard key={canvas.id} selected={selected === canvas.id} canvas={canvas} onSelect={onSelect}/>)}
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
    const {className, classes, canvases, selected, onSelect} = this.props

    return <div className={classnames(classes.root, className)}>
      {canvases.map(canvas => <CanvasCard key={canvas.id} canvas={canvas} className={classes.card} selected={selected === canvas.id} onSelect={onSelect}/>)}
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
          style={{height: 50}}
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
          {item ? <CanvasCard canvas={item} selected={item === canvas} onSelect={onItemPicked}/> : '[canvas-not-loaded]'}
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


export const CanvasTree = picked(['range', 'canvas'])(class CanvasTree extends React.Component {
  handleDeleteCanvasPointOverride = id => {
    const {range, deleteRangePoint} = this.props
    deleteRangePoint(range.get('id'), id, {sourceId: 'web'})
  }

  render() {
    const {className, canvas, onItemPicked, updateCanvas} = this.props
    if (!canvas) return <div/>
    return <div className={className}>
      <CanvasForm canvas={canvas} updateCanvas={updateCanvas} deleteCanvasPointOverride={this.handleDeleteCanvasPointOverride}/>
    </div>
  }
})
