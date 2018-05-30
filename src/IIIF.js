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
          manifestDetail.structuresWithCanvases = manifestDetail.structures.forEach(structure => {
            if (structure.canvases) {
              structure.label += `(${structure.canvases.length})`
            }
          })
          manifestDetail.structuresWithCanvases = manifestDetail.structures.filter(structure => structure.canvases)
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
  constructor(props) {
    super(props)
    this.state = {value: null, items: props.items}
  }

  componentWillReceiveProps(nextProps) {
    const {items} = nextProps
    if (items !== this.state.items) {
      this.setState({value: null, items})
    }
  }

  handleOnMenuOpen = (ev) => {
    ev.preventDefault()
    this.setState({anchorEl: ev.currentTarget})
  }

  handleOnMenuClose = (ev) => {
    ev.preventDefault()
    console.log('handleOnMenuClose', ev.currentTarget.value)
    this.setState({anchorEl: null, value: ev.currentTarget.value})
  }

  handleOnClose = (ev) => {
    ev.preventDefault()
    this.setState({anchorEl: null, value: null})
  }


	handleOnClick = (ev, id) => {
    ev.preventDefault()
    const {expanded} = this.state
    this.setState({expanded: expanded === id ? false : id})
  }

  render() {
		const {className, classes, items, Icon, IconLabel, ItemDetail} = this.props
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
          return <MenuItem key={id} value={index} onClick={this.handleOnMenuClose}>{label}[{id}.{index}]</MenuItem>
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
  card: {
    '&> img': {
      width: '100%',
      height: '100%',
    },
  },
}

export const CanvasCard = withStyles(canvasCardStyles)(class CanvasCard extends React.Component {
  render() {
    const {className, classes, canvas} = this.props
    const {id, thumbnail} = canvas
    return <Card className={classnames(classes.card, className)}>
      <img src={`${thumbnail}/full/full/0/default.jpg`}/>
    </Card>
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
    const {classes, className, canvases} = this.props
    return <GISGrid className={classnames(classes.root, className)}>
      {canvases.map(canvas => <CanvasCard key={canvas.id} canvas={canvas}/>)}
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
    const {className, classes, canvases} = this.props

    return <div className={classnames(classes.root, className)}>
      {canvases.map(canvas => <CanvasCard key={canvas.id} canvas={canvas} className={classes.card}/>)}
    </div>
  }
})

class ManifestDetail extends AbstractDetail {
  _type = 'manifest'

  render() {
    const {className, item: manifest, onItemPicked} = this.props
    if (!manifest) return <div/>
    const {structures, structuresWithCanvases} = manifest
    return <ExpandoList className={className} items={structures} Icon={<div/>} IconLabel='Structure' ItemDetail={<StructureDetail manifestId={manifest.id} onItemPicked={onItemPicked}/>}/>
  }
}

class CollectionMembers extends AbstractDetail {
  _type = 'collection'

  render() {
		const {className, item: collection, onItemPicked} = this.props
    if (!collection) return <div/>
    const {members} = collection
    return <ExpandoList className={className} items={members} Icon={<div/>} IconLabel='Manifest' ItemDetail={<ManifestDetail onItemPicked={onItemPicked}/>}/>
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
    this.state = {collections: []}
  }

  componentWillMount() {
    globalData.then(data => {
      this.setState({collections: data})
    })
  }

  render() {
		const {classes, onItemPicked} = this.props
    const {collections, expanded} = this.state
    return <List className={classes.root} dense={true}>
      <ExpandoList items={collections} Icon={<CollectionsIcon/>} IconLabel='Collection' ItemDetail={<CollectionMembers onItemPicked={onItemPicked}/>}/>
    </List>
  }
})


