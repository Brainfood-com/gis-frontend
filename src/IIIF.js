import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Collapse from '@material-ui/core/Collapse'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Typography from '@material-ui/core/Typography'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import CloseIcon from '@material-ui/icons/Close'
import CollectionsIcon from '@material-ui/icons/Collections'
import GridList from '@material-ui/core/GridList'
import GridListTile from '@material-ui/core/GridListTile'
import Card from '@material-ui/core/Card'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import classnames from 'classnames'

import {makeUrl} from './api'

async function fetchIIIFData() {
  const collections = await fetch(makeUrl('api', 'collection')).then(data => data.json())
  return await Promise.all(collections.map(async collection => {
    console.log('collection', collection)
    const collectionDetail = await fetch(makeUrl('api', `collection/${collection.id}`)).then(data => data.json())
    const members = collectionDetail.members = await Promise.all(collectionDetail.members.map(async member => {
      switch (member.type) {
        case 'sc:Manifest':
          const manifestDetail = await fetch(makeUrl('api', `manifest/${member.id}`)).then(data => data.json())
          manifestDetail.structures.forEach(structure => {
            if (structure.canvases) {
              structure.label += `(${structure.canvases.length})`
            }
            if (structure.pointOverrideCount) {
              structure.label += `(p=${structure.pointOverrideCount})`
            }
          })
          manifestDetail.structuresWithCanvases = manifestDetail.structures.filter(structure => structure.canvases && structure.canvases.length)
          return manifestDetail
      }
    }))
    return collectionDetail
  }))
}
const globalData = fetchIIIFData()

const expandoListStyles = theme => ({
  root: {},
  heading: {},
  secondaryHeading: {},
  nested: {
    paddingLeft: theme.spacing.unit * 1,
  },
})

export const ExpandoList = withStyles(expandoListStyles)(class ExpandoList extends React.Component {
  static defaultProps = {
    onItemPicked(index) {},
  }

  constructor(props) {
    super(props)
    const {items, itemId} = props
    const value = !!itemId && items ? items.findIndex(item => item.id === itemId) : null
    this.state = {value, items}
  }

  componentWillReceiveProps(nextProps) {
    const {items, itemId} = nextProps
    if (items !== this.state.items) {
      this.setState({value: items.findIndex(item => item.id === itemId), items})
    } else if (!!itemId) {
      this.setState({value: this.state.items.findIndex(item => item.id === itemId)})
    }
  }

  handleOnMenuOpen = (ev) => {
    ev.preventDefault()
    this.setState({anchorEl: ev.currentTarget})
  }

  handleOnMenuClose = (ev) => {
    ev.preventDefault()
    const {currentTarget: {value}} = ev
    console.log('handleOnMenuClose', value)
    this.setState({anchorEl: null})
    if (value !== undefined) {
      this.setState({value})
      this.props.onItemPicked(value)
    }
  }

  handleOnClose = (ev) => {
    ev.preventDefault()
    this.setState({anchorEl: null, value: null})
    this.props.onItemPicked(null)
  }


	handleOnClick = (ev, id) => {
    ev.preventDefault()
    const {expanded} = this.state
    this.setState({expanded: expanded === id ? false : id})
  }

  render() {
		const {className, classes, itemId, items = [], Icon, IconLabel, ItemDetail} = this.props
    const {anchorEl, value} = this.state
    const isOpen = value !== null
    const item = isOpen ? items[value] : null
    return <React.Fragment>
      <ListItem button disableGutters className={classnames(classes.root, className)} onClick={this.handleOnMenuOpen}>
        <Avatar>{Icon}</Avatar>
        <ListItemText primary={item ? item.label : IconLabel}/>
        <ListItemSecondaryAction disabled={!isOpen}>
          <Button disabled={!isOpen} onClick={this.handleOnClose}>
            <CloseIcon/>
          </Button>
        </ListItemSecondaryAction>
      </ListItem>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={this.handleOnMenuClose}>
        {items.map((item, index) => {
          const {id, label} = item
          return <MenuItem key={id} selected={index === value} value={index} onClick={this.handleOnMenuClose}>{label}[{id}.{index}]({item.type})</MenuItem>
        })}
      </Menu>
      <Collapse in={isOpen} unmountOnExit>
        {React.cloneElement(ItemDetail, {item})}
      </Collapse>
    </React.Fragment>
  }
})

const gisGridStyles = {
  root: {
  },
  cell: {
		width: '33.33333%',
    display: 'inline-block',
  },
  cellContent: {
    display: 'inline-block',
		width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  childChildContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
	},

	ratioDefault: {
		height: '100%',
  },
  ratio16x9: {
    paddingTop: '56.25%',
  },
  ratio4x3: {
    paddingTop: '75%',
  },
}

const GISGrid = withStyles(gisGridStyles)(class GISGrid extends React.Component {

	render() {
    const {className, classes, children} = this.props

    return <div className={classnames(classes.root, className)}>
      {React.Children.map(children, (child, index) => {
        const cellClasses = {
          [classes.cell]: true,
        }
        const cellContentClasses = {
          [classes.cellContent]: true,
          [classes.ratio16x9]: true,
        }
        const cellChildClasses = {
          [classes.childChildContent]: true,
        }

        return <div key={index} className={classnames(cellClasses)}>
          <div className={classnames(cellContentClasses)}>
            <div className={classnames(cellChildClasses)}>{React.cloneElement(child)}</div>
          </div>
        </div>
      })}
    </div>
  }
})

const structureStyles = {
  root: {
  },
  header: {
  },
  grid: {
  },
}

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
    onRemoveOverride(event) {},
  }

  render() {
    const {className, classes, canvas, selected, onRemoveOverride} = this.props
    const hasOverride = canvas && canvas.overrides && !!canvas.overrides.find(override => override.point)
    const rootClasses = {
      [classes.root]: true,
      [classes.hidden]: !!!canvas,
      [classes.override]: hasOverride,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <CanvasCard canvas={canvas} className={classes.card}/>
      <Button fullWidth variant='raised' onClick={onRemoveOverride} className={classes.removeOverride}>
        Remove Override
      </Button>
      <TextField fullWidth label='Notes' multiline={true} rows={5}/>
    </Paper>
  }
})

class AbstractDetail extends React.Component {
  static defaultProps = {
    onItemPicked(type, item) {},
  }

  componentDidMount() {
    const {item, onItemPicked} = this.props
    onItemPicked(this._type, item)
  }

  componentWillReceiveProps(nextProps) {
    const {item, onItemPicked} = nextProps
    if (item !== this.props.item || onItemPicked !== this.props.onItemPicked) {
      onItemPicked(this._type, item)
    }
  }
}

const StructureDetail = withStyles(structureStyles)(class StructureDetail extends AbstractDetail {
  _type = 'structure'

  render() {
    const {classes, className, item: structure} = this.props
    if (!structure) return <div/>
    const {label} = structure
    return <div className={classnames(classes.root, className)}>
      <Typography className={classes.header}>{label}</Typography>
    </div>
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
      {slidingWindow.map(canvas => {
        return <div key={canvas.id} className={classes.container}>
          <CanvasCard canvas={canvas} selected={selected === canvas.id} onSelect={onSelect}/>
        </div>
      })}
    </div>
  }
})

class ManifestDetail extends AbstractDetail {
  _type = 'manifest'

  render() {
    const {className, item: manifest, onItemPicked, picked} = this.props
    if (!manifest) return <div/>
    const {structures, structuresWithCanvases} = manifest
    return <ExpandoList className={className} items={structuresWithCanvases} itemId={picked.structure} Icon={<div/>} IconLabel='Structure' ItemDetail={<StructureDetail manifestId={manifest.id} onItemPicked={onItemPicked} picked={picked}/>}/>
  }
}

class CollectionMembers extends AbstractDetail {
  _type = 'collection'

  render() {
		const {className, item: collection, onItemPicked, picked} = this.props
    if (!collection) return <div/>
    const {members} = collection
    return <ExpandoList className={className} items={members} itemId={picked.manifest} Icon={<div/>} IconLabel='Manifest' ItemDetail={<ManifestDetail onItemPicked={onItemPicked} picked={picked}/>}/>
  }
}

const iiifTreeStyles = {
  root: {
  },
}

export const IIIFTree = withStyles(iiifTreeStyles)(class IIIFTree extends React.Component {
  static defaultProps = {
    onItemPicked(type, item) {},
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  componentWillMount() {
    globalData.then(data => {
      this.setState({collections: data})
    })
  }

  render() {
		const {classes, onItemPicked, picked} = this.props
    const {collections, expanded} = this.state
    return <List className={classes.root} dense={true}>
      <ExpandoList items={collections} itemId={picked.collection} Icon={<CollectionsIcon/>} IconLabel='Collection' ItemDetail={<CollectionMembers onItemPicked={onItemPicked} picked={picked}/>}/>
    </List>
  }
})


