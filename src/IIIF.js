import React from 'react'
import CollectionsIcon from '@material-ui/icons/Collections'

import {makeUrl} from './api'
import ExpandoList from './ExpandoList'
import * as iiifRedux from './iiif/redux'
import connectHelper from './connectHelper'
import {picked} from './iiif/Picked'
import {ManifestTree} from './iiif/Manifest'
import {CollectionTree} from './iiif/Collection'
import {RangeTree} from './iiif/Range'
import {CanvasTree} from './iiif/Canvas'

const Root = picked(['collection'])(class Root extends React.Component {
  render() {
		const {className, collections, onItemPicked, collection} = this.props
    return <div className={className}>
      <ExpandoList items={collections} selectedItem={collection} Icon={<CollectionsIcon/>} IconLabel='Collection' onItemPicked={onItemPicked}/>
    </div>
  }
})

const treeRedux = {
  mapStateToProps(store, props) {
    const collections = store.iiif.get(iiifRedux.MODEL['collection'])
    return {collections}
  },
}

export const IIIFTree = connectHelper(treeRedux)(class IIIFTree extends React.Component {
  render() {
		const {className, collections} = this.props
    return <div className={className}>
      <Root collections={collections}/>
      <CollectionTree/>
      <ManifestTree/>
      <RangeTree/>
      <CanvasTree/>
    </div>
  }
})
