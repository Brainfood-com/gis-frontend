import {Map as imMap} from 'immutable'
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
import {checkPermission, picked as userPicked} from '../User'
import IIIFTagEditor, {commonTagDefinitions} from './Tags'
import { AbstractForm } from './base'

const collectionFormStyles = {
  root: {
  },
}

const collectionTagSuggestions = [
  commonTagDefinitions.CLAIMED,
]
const collectionBfTagSuggestions = [
  commonTagDefinitions.BF_TRAINING_EXAMPLE,
]

const fieldInputProcessors = {
}

function getDerivedStateFromProps(props, state) {
  const {collection} = props
  return {collection: collection instanceof imMap ? collection.toJS() : collection}
}

const CollectionForm = flow(withStyles(collectionFormStyles))(class CollectionForm extends AbstractForm {
  static modelName = 'collection'
  static fieldInputProcessors = fieldInputProcessors
  static updaterName = 'updateCollection'
  static complexFields = ['tags', 'values.bftags']
  static defaultProps = {
    updateCollection(id, data) {},
  }

  render() {
    const {className, classes, collection, onRemoveOverride, permissions} = this.props
    if (!collection || !checkPermission(permissions, null, 'collection', 'form')) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault('notes', '')} multiline={true} rows={3} onChange={this.handleInputChange}/>
      {checkPermission(permissions, null, 'brainfood', 'admin')
        ? <IIIFTagEditor name='values.bftags' label='Brainfood Tags' modelName='collection' suggestions={collectionBfTagSuggestions} value={this.checkOverrideValueDefault('values.bftags', [])} onChange={this.handleInputChange}/>
        : null
      }
      <IIIFTagEditor name='tags' modelName='collection' suggestions={collectionTagSuggestions} value={this.checkOverrideValueDefault('tags', [])} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export class CollectionTitle extends React.Component {
  render() {
    const {className, collection} = this.props

    const {id, label} = collection || {}
    return <Typography variant='body1' classes={{body1: className}}>{label}</Typography>
  }
}

const collectionBriefStyles = {
  root: {
  },
}

export const CollectionBrief = flow(withStyles(collectionBriefStyles))(class CollectionBrief extends React.Component {
  static propTypes = {
  }

  static defaultProps = {
    onItemPicked(id) {},
  }

  handleOnClick = event => {
    event.preventDefault()
    const {onItemPicked, collection} = this.props
    onItemPicked(collection.id)
  }

  render() {
    const {className, classes, collection} = this.props
    if (!collection) {
      return <div />
    }

    const {id, label} = collection
    return <Paper className={classnames(classes.root, className)} onClick={this.handleOnClick}>
      <Typography>{label}</Typography>
    </Paper>
  }
})

class CollectionPick extends React.Component {
  render() {
    const {className, collections, onItemPicked, collection} = this.props
    return <ExpandoList className={className} items={collections} selectedItem={collection} IconLabel='Collection' onItemPicked={onItemPicked}/>
  }
}

export const CollectionPanel = flow(picked(['root', 'collection']), userPicked('permissions'))(class CollectionPanel extends React.Component {
  state = {}

  static getDerivedStateFromProps = getDerivedStateFromProps

  render() {
    const {className, collections, updateCollection, onItemPicked, permissions, ...props} = this.props
    const {collection} = this.state

    return <ItemPanel
      className={className}
      name='collection'
      title={<CollectionTitle collection={collection}/>}
      brief={<CollectionBrief collection={collection}/>}
      pick={<CollectionPick collections={collections} onItemPicked={onItemPicked} collection={this.props.collection}/>}
      icon={<CollectionsIcon/>}
      showForm={checkPermission(permissions, null, 'collection', 'form')}
      form={<CollectionForm {...props} permissions={permissions} collection={collection} updateCollection={updateCollection}/>}
      busy={collection && collection._busy}
    />
  }
})
