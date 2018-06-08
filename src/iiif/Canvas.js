import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import List from '@material-ui/core/List'
import Card from '@material-ui/core/Card'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import classnames from 'classnames'

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

export const CanvasCard = withStyles(canvasCardStyles)(class CanvasCard extends React.Component {
  static defaultProps = {
    onSelect: function() {},
  }

  handleOnClick = event => {
    const {canvas, onSelect} = this.props
    onSelect(canvas)
  }

  render() {
    const {className, classes, canvas, selected} = this.props
    if (!canvas) {
      return <div/>
    }
    const {id, thumbnail} = canvas
    const wantedClasses = {
      [classes.root]: true,
      [classes.selected]: selected,
      [classes.override]: canvas.overrides && !!canvas.overrides.find(override => override.point),
    }
    return <div className={classnames(wantedClasses, className)}>
      <Card className={classes.card} onClick={this.handleOnClick}>
        <img src={`${thumbnail}/full/full/0/default.jpg`}/>
      </Card>
    </div>
  }
})

const canvasDetailStyles = {
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
export const CanvasDetail = withStyles(canvasDetailStyles)(class CanvasDetail extends React.Component {
  static defaultProps = {
    onUpdate(canvas, data) {},
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  componentWillMount() {
    this.setState(this.processProps(this.state, {}, this.props))
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.processProps(this.state, this.props, nextProps))
  }

  processProps(prevState, prevProps, nextProps) {
    const {canvas} = nextProps
    const result = {}
    if (prevProps.canvas !== canvas) {
      result.hasOverride = canvas && canvas.overrides && !!canvas.overrides.find(override => override.point)
      result.notes = canvas ? canvas.notes : undefined
    }
    return result
  }

  handleInputChange = (event) => {
    const {name} = event.currentTarget
    switch (name) {
      case 'override':
        this.setState({hasOverride: false})
        this.onUpdate()
        return
    }
    const {value} = event.currentTarget
    if (this.state[name] !== value) {
      this.setState({[name]: value})
      this.onUpdate()
    }
  }

  onUpdate() {
    this.setState((prevState, props) => {
      const {canvas, onUpdate} = props
      const {hasOverride, notes} = prevState
      onUpdate(canvas, {hasOverride, notes})
    })
  }

  render() {
    const {className, classes, canvas, selected} = this.props
    const {hasOverride} = this.state
    const rootClasses = {
      [classes.root]: true,
      [classes.hidden]: !!!canvas,
      [classes.override]: hasOverride,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <Typography variant='heading'>Canvas</Typography>
      <CanvasCard canvas={canvas} className={classes.card}/>
      <Button name='override' fullWidth variant='raised' className={classes.removeOverride} onClick={this.handleInputChange}>
        Remove Override
      </Button>
      <TextField name='notes' fullWidth label='Notes' multiline={true} rows={5}/>
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
export const CanvasSlidingList = withStyles(canvasSlidingListStyles)(class CanvasSlidingList extends React.Component {
  render() {
    const {className, classes, canvases, selected, onSelect} = this.props
    const position = selected ? canvases.findIndex(canvas => selected === canvas.id) : -1
    if (position === -1) {
      return <div />
    }
    const slidingWindow = canvases.slice(Math.max(0, position - 2), Math.min(canvases.length, position + 3))

    return <div className={classnames(classes.root, className)}>
      {Array.from(Array(Math.abs(Math.min(0, position - 2)))).map((value, index) => {
        return <div key={index} className={classes.container}>[lead-in-blank]</div>
      })}
      {slidingWindow.map(canvas => {
        return <div key={canvas.id} className={classes.container}>
          <CanvasCard canvas={canvas} selected={selected === canvas.id} onSelect={onSelect}/>
        </div>
      })}
      {Array.from(Array(Math.abs(Math.max(0, position - canvases.length + 3)))).map((value, index) => {
        return <div key={index} className={classes.container}>[lead-out-blank]</div>
      })}
    </div>
  }
})
