import {Collection as imCollection, List as imList, Map as imMap} from 'immutable'
import flow from 'lodash-es/flow'
import React from 'react'
import PropTypes from 'prop-types'
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
import {immutableEmptyList, immutableEmptyMap} from '../constants'

import {picked} from './Picked'
import ItemPanel from '../ItemPanel'
import {checkPermission, picked as userPicked} from '../User'
import IIIFTagEditor, {commonTagDefinitions} from './Tags'
import { AbstractForm } from './base'
import { CollectionStatusShape, CollectionShape, CollectionsShape } from './Types'

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

const CollectionForm = flow(withStyles(collectionFormStyles))(class CollectionForm extends AbstractForm {
  static modelName = 'collection'
  static fieldInputProcessors = fieldInputProcessors
  static updaterName = 'updateCollection'
  static complexFields = ['tags', 'values.bftags']
  static propTypes = {
    collection: CollectionShape,
    updateCollection: PropTypes.func,
  }

  render() {
    const {className, classes, collection, permissions} = this.props
    if (!collection || !checkPermission(permissions, null, 'collection', 'form')) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault('notes', '')} multiline={true} rows={3} onChange={this.handleInputChange}/>
      {checkPermission(permissions, null, 'brainfood', 'admin')
        ? <IIIFTagEditor name='values.bftags' label='Brainfood Tags' modelName='collection' suggestions={collectionBfTagSuggestions} value={this.checkOverrideValueDefault('values.bftags', immutableEmptyList)} onChange={this.handleInputChange}/>
        : null
      }
      <IIIFTagEditor name='tags' modelName='collection' suggestions={collectionTagSuggestions} value={this.checkOverrideValueDefault('tags', immutableEmptyList)} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export class CollectionTitle extends React.Component {
  static propTypes = {
    collection: CollectionShape,
  }

  render() {
    const {className, collection} = this.props
    if (!collection) {
      return <div/>
    }

    const label = collection.get('label')
    return <Typography variant='body1' classes={{body1: className}}>{label}</Typography>
  }
}

const collectionBriefStyles = {
  root: {
  },
}

export const CollectionBrief = flow(withStyles(collectionBriefStyles))(class CollectionBrief extends React.Component {
  static propTypes = {
    collection: CollectionShape,
    onItemPicked: PropTypes.func.isRequired,
  }

  handleOnClick = event => {
    event.preventDefault()
    const {onItemPicked, collection} = this.props
    onItemPicked(collection.get('id'))
  }

  render() {
    const {className, classes, collection} = this.props
    if (!collection) {
      return <div />
    }

    const label = collection.get('label')
    return <Paper className={classnames(classes.root, className)} onClick={this.handleOnClick}>
      <Typography>{label}</Typography>
    </Paper>
  }
})

class CollectionPick extends React.Component {
   static propTypes = {
    collection: CollectionShape,
    collections: CollectionsShape.isRequired,
    onItemPicked: PropTypes.func.isRequired,
  }

  render() {
    const {className, collections, onItemPicked, collection} = this.props
    return <ExpandoList className={className} itemMap={collections} selectedItem={collection} IconLabel='Collection' onItemPicked={onItemPicked}/>
  }
}

export const CollectionPanel = flow(picked(['root', 'collection']), userPicked('permissions'))(class CollectionPanel extends React.Component {
   static propTypes = {
    collection: CollectionShape,
    collections: CollectionsShape.isRequired,
    collectionStatus: CollectionStatusShape,
    onItemPicked: PropTypes.func,
    updateCollection: PropTypes.func,
  }

  static defaultProps = {
    onItemPicked(id) {},
    updateCollection(id, data) {},
  }

  render() {
    const {className, collection, collections, collectionStatus, updateCollection, onItemPicked, permissions, ...props} = this.props

    return <ItemPanel
      className={className}
      name='collection'
      title={<CollectionTitle collection={collection}/>}
      brief={<CollectionBrief collection={collection} onItemPicked={onItemPicked}/>}
      pick={<CollectionPick collections={collections} onItemPicked={onItemPicked} collection={collection}/>}
      icon={<CollectionsIcon/>}
      showForm={checkPermission(permissions, null, 'collection', 'form')}
      form={<CollectionForm {...props} permissions={permissions} collection={collection} updateCollection={updateCollection}/>}
      busy={collectionStatus.get('busy')}
    />
  }
})
