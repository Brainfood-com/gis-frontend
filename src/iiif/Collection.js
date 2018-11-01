import Immutable from 'immutable'
import flow from 'lodash-es/flow'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import CollectionsIcon from '@material-ui/icons/Collections'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormLabel from '@material-ui/core/FormLabel'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import classnames from 'classnames'

import connectHelper from '../connectHelper'
import ExpandoList from '../ExpandoList'
import * as iiifRedux from './redux'

import {picked} from './Picked'
import ItemPanel from '../ItemPanel'
import DebouncedForm from '../DebouncedForm'
import IIIFTagEditor, {commonTagDefinitions} from './Tags'

const collectionFormStyles = {
  root: {
  },
}

const collectionTagSuggestions = [
  commonTagDefinitions.CLAIMED,
]

const emptyList = Immutable.List()

const fieldInputProcessors = {
}
export const CollectionForm = flow(picked(['collection']), withStyles(collectionFormStyles))(class CollectionForm extends DebouncedForm {
  static defaultProps = {
    updateCollection(id, data) {},
  }

  flushInputChange = (name, value, checked) => {
    const {collection, updateCollection} = this.props
    const {[name]: inputProcessor = value => value} = fieldInputProcessors
    const processedValue = inputProcessor(value)
    const currentValue = collection.get(name)
    if (currentValue !== processedValue) {
      updateCollection(collection.get('id'), {[name]: processedValue})
    }
  }

  render() {
    const {className, classes, collection, onRemoveOverride} = this.props
    if (!collection) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault(collection, 'notes', fieldInputProcessors, '')} multiline={true} rows={3} onChange={this.handleInputChange}/>
      <IIIFTagEditor name='tags' suggestions={collectionTagSuggestions} value={this.checkOverrideValueDefault(collection, 'tags', fieldInputProcessors, emptyList)} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export const CollectionPick = picked(['root', 'collection'])(class CollectionPick extends React.Component {
  render() {
    const {className, collections, onItemPicked, collection} = this.props
    return <ExpandoList className={className} items={collections} selectedItem={collection} IconLabel='Collection' onItemPicked={onItemPicked}/>
  }
})

export const CollectionPanel = picked(['root', 'collection'])(class CollectionPanel extends React.Component {
  render() {
    const {className, collections, collection} = this.props

    const title = collection ? collection.get('label') : 'Collection'
    return <ItemPanel className={className} name='collection' title={title} pick={<CollectionPick/>} form={<CollectionForm/>} busy={collection && collection.get('_busy')}/>
  }
})
