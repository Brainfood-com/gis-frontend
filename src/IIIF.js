import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import Typography from '@material-ui/core/Typography'
import CollectionsIcon from '@material-ui/icons/Collections'
import classnames from 'classnames'

import {makeUrl} from './api'
import ExpandoList from './ExpandoList'

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

const structureStyles = {
  root: {
  },
  header: {
  },
  grid: {
  },
}
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


