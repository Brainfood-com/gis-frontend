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
import {immutableEmptyList, immutableEmptyMap, immutableEmptyOrderedMap} from '../constants'

import {picked} from './Picked'
import ItemPanel from '../ItemPanel'
import {checkPermission, picked as userPicked} from '../User'
import IIIFTagEditor, {commonTagDefinitions} from './Tags'
import { AbstractForm } from './base'
import { isRequiredWhenOther, CollectionShape, ManifestStatusShape, ManifestShape, ManifestsShape } from './Types'

const manifestFormStyles = {
  root: {
  },
}

const fieldInputProcessors = {
  'values.year'(value, checked) {
    return value === '' ? null : parseInt(value)
  },
}

const manifestTagSuggestions = [
  commonTagDefinitions.CLAIMED,
]
const manifestBfTagSuggestions = [
  commonTagDefinitions.BF_TRAINING_EXAMPLE,
]

const ManifestForm = flow(withStyles(manifestFormStyles))(class ManifestForm extends AbstractForm {
  static modelName = 'manifest'
  static fieldInputProcessors = fieldInputProcessors
  static updaterName = 'updateManifest'
  static complexFields = ['tags', 'values.bftags']
  static propTypes = {
    manifest: ManifestShape,
    updateManifest: PropTypes.func.isRequired,
  }

  render() {
    const {className, classes, manifest, permissions} = this.props
    if (!manifest) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <TextField name='values.year' fullWidth label='Year' value={this.checkOverrideValueDefault('values.year', '')} onChange={this.handleInputChange}/>
      <TextField name='values.batch' fullWidth label='Batch' value={this.checkOverrideValueDefault('values.batch', '')} onChange={this.handleInputChange}/>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault('notes', '')} multiline={true} rows={3} onChange={this.handleInputChange}/>
      {checkPermission(permissions, null, 'brainfood', 'admin')
        ? <IIIFTagEditor name='values.bftags' label='Brainfood Tags' modelName='manifest' suggestions={manifestBfTagSuggestions} value={this.checkOverrideValueDefault('values.bftags', immutableEmptyList)} onChange={this.handleInputChange}/>
        : null
      }
      <IIIFTagEditor name='tags' modelName='manifest' suggestions={manifestTagSuggestions} value={this.checkOverrideValueDefault('tags', immutableEmptyList)} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export class ManifestTitle extends React.Component {
  static propTypes = {
    manifest: ManifestShape,
  }

  render() {
    const {className, manifest} = this.props
    if (!manifest) return <div/>

    const {label} = manifest.toJSON()
    return <Typography variant='body1' classes={{body1: className}}>{label}</Typography>
  }
}

const manifestBriefStyles = {
  root: {
  },
}

export const ManifestBrief = flow(withStyles(manifestBriefStyles))(class ManifestBrief extends React.Component {
  static propTypes = {
    manifest: ManifestShape,
    onItemPicked: PropTypes.func.isRequired,
  }

  handleOnClick = event => {
    event.preventDefault()
    const {onItemPicked, manifest} = this.props
    onItemPicked(manifest.get('id'))
  }

  render() {
    const {className, classes, manifest} = this.props
    if (!manifest) return <div/>

    const {label} = manifest.toJSON()
    return <Paper className={classnames(classes.root, className)} onClick={this.handleOnClick}>
      <Typography>{label}</Typography>
    </Paper>
  }
})

class ManifestPick extends React.Component {
   static propTypes = {
    collection: CollectionShape,
    manifest: ManifestShape,
    manifests: ManifestsShape.isRequired,
    onItemPicked: PropTypes.func.isRequired,
  }

  render() {
    const {className, collection, manifests, manifest, onItemPicked} = this.props
    if (!collection) return <Typography>Please select a collection.</Typography>
    return <ExpandoList className={className} itemList={collection.get('manifests')} itemMap={manifests} selectedItem={manifest} IconLabel='Manifest' onItemPicked={onItemPicked}/>
  }
}

export const ManifestPanel = flow(picked(['collection', 'manifest']), userPicked('permissions'))(class ManifestPanel extends React.Component {
   static propTypes = {
    collection: CollectionShape,
    manifest: ManifestShape,
    manifests: isRequiredWhenOther(ManifestsShape, 'collection'),
    onItemPicked: PropTypes.func,
    updateManifest: PropTypes.func,
  }

  static defaultProps = {
    onItemPicked(id) {},
    updateManifest(id, data) {},
  }

  render() {
    const {className, collection, manifest, manifests, manifestStatus, onItemPicked, updateManifest, permissions, ...props} = this.props

    if (!collection) return <div/>
    return <ItemPanel
      className={className}
      name='manifest'
      title={<ManifestTitle manifest={manifest}/>}
      brief={<ManifestBrief manifest={manifest} onItemPicked={onItemPicked}/>}
      pick={<ManifestPick collection={collection} manifests={manifests} manifest={manifest} onItemPicked={onItemPicked}/>}
      icon={<CollectionsIcon/>}
      showForm={checkPermission(permissions, null, 'manifest', 'form')}
      form={<ManifestForm {...props} permissions={permissions} manifest={manifest} updateManifest={updateManifest}/>}
      busy={manifestStatus.get('busy')}
    />
  }
})
