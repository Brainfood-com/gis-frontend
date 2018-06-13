import _ from 'lodash'
import React from 'react'
import Immutable from 'immutable'
import { withStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import Typography from '@material-ui/core/Typography'
import CollectionsIcon from '@material-ui/icons/Collections'
import classnames from 'classnames'

import {makeUrl, safeGetImmutableId} from './api'
import ExpandoList from './ExpandoList'
import * as iiifRedux from './iiif/redux'
import connectHelper from './connectHelper'
import {AbstractDetail} from './iiif/base'
import {RangeDetail} from './iiif/Range'

async function fetchIIIFData() {
  const collections = await fetch(makeUrl('api', 'collection')).then(data => data.json())
  return await Promise.all(collections.map(async collection => {
    //console.log('collection', collection)
    const collectionDetail = await fetch(makeUrl('api', `collection/${collection.id}`)).then(data => data.json())
    const members = collectionDetail.members = await Promise.all(collectionDetail.members.map(async member => {
      switch (member.type) {
        case 'sc:Manifest':
          const manifestDetail = await fetch(makeUrl('api', `manifest/${member.id}`)).then(data => data.json())
          const manifestStructures = manifestDetail.structures = await fetch(makeUrl('api', `manifest/${member.id}/structures`)).then(data => data.json())
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
    //console.log('collectionDetail', collectionDetail)
    return collectionDetail
  }))
}
//const globalData = fetchIIIFData()

const iiifXRefResolve = (store, ownerKey, ownerModel, id, xrefKey, xrefModel) => {
  const owner = store.iiif.getIn([ownerModel, id])
  const xrefArray = store.iiif.getIn([ownerModel, id, xrefKey], [])
  //console.log('iiifXRefResolve', ownerKey, ownerModel, id, owner ? owner.toJSON() : null, xrefArray)
  const xrefList = Immutable.OrderedMap().withMutations(target => {
    xrefArray.forEach(xrefId => target.set(xrefId, store.iiif.getIn([xrefModel, xrefId])))
  })
  return {[ownerKey]: owner, [xrefKey]: xrefList}
}

const manifestDetailRedux = {
  mapStateToProps(store, props) {
    const id = safeGetImmutableId(props.item)
    //console.log('ManifestDetail:mapStateToProps', id, store.iiif)
    const picked = store.iiif.getIn([iiifRedux.MODEL['picked'], 'range', 'value'])
    return {picked, ...iiifXRefResolve(store, 'manifest', iiifRedux.MODEL['sc:Manifest'], id, 'rangesWithCanvases', iiifRedux.MODEL['sc:Range'])}
  },
  mapDispatchToProps: {
    getItem: iiifRedux.getManifest,
  },
}
const ManifestDetail = _.flow(connectHelper(manifestDetailRedux))(class ManifestDetail extends AbstractDetail {
  _type = 'manifest'

  render() {
    const {className, manifest, rangesWithCanvases, onItemPicked, picked} = this.props
    if (!manifest || !rangesWithCanvases) return <div/>
    return <ExpandoList className={className} items={rangesWithCanvases} itemId={picked} Icon={<div/>} IconLabel='Range' ItemDetail={<RangeDetail/>}/>
  }
})

const collectionMembersRedux = {
  mapStateToProps(store, props) {
    const id = safeGetImmutableId(props.item)
    //console.log('CollectionMembers:mapStateToProps', id, props.item, store.iiif)
    const picked = store.iiif.getIn([iiifRedux.MODEL['picked'], 'manifest', 'value'])
    return {picked, ...iiifXRefResolve(store, 'collection', iiifRedux.MODEL['sc:Collection'], id, 'members', iiifRedux.MODEL['sc:Manifest'])}
  },
  mapDispatchToProps: {
    getItem: iiifRedux.getCollection,
  },
}

const CollectionMembers = _.flow(connectHelper(collectionMembersRedux))(class CollectionMembers extends AbstractDetail {
  _type = 'collection'

  render() {
		const {className, collection, members, onItemPicked, picked} = this.props
    //console.log('CollectionMembers:collection', collection, members)
    if (!collection || !members) return <div/>
    return <ExpandoList className={className} items={members} itemId={picked} Icon={<div/>} IconLabel='Manifest' ItemDetail={<ManifestDetail/>}/>
  }
})

const iiifTreeStyles = {
  root: {
  },
}


const iiifTreeRedux = {
  mapStateToProps(store, props) {
    //console.log('iiif', store.iiif.toJSON())
    const collections = store.iiif.get(iiifRedux.MODEL['sc:Collection'])
    const picked = store.iiif.getIn([iiifRedux.MODEL['picked'], 'collection', 'value'])
    return {collections, picked}
  },
}
export const IIIFTree = _.flow(connectHelper(iiifTreeRedux), withStyles(iiifTreeStyles))(class IIIFTree extends React.Component {
  render() {
		const {classes, collections, picked} = this.props
    return <List className={classes.root} dense={true}>
      <ExpandoList items={collections} itemId={picked} Icon={<CollectionsIcon/>} IconLabel='Collection' ItemDetail={<CollectionMembers/>}/>
    </List>
  }
})


