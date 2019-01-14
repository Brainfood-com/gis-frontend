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

function getDerivedStateFromProps(props, state) {
  const {manifest} = props
  return {manifest: manifest instanceof imMap ? manifest.toJS() : manifest}
}

const ManifestForm = flow(withStyles(manifestFormStyles))(class ManifestForm extends AbstractForm {
  static modelName = 'manifest'
  static fieldInputProcessors = fieldInputProcessors
  static updaterName = 'updateManifest'
  static complexFields = ['tags']
  static defaultProps = {
    updateManifest(id, data) {},
  }

  render() {
    const {className, classes, manifest, onRemoveOverride} = this.props
    if (!manifest) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <TextField name='values.year' fullWidth label='Year' value={this.checkOverrideValueDefault('values.year', '')} onChange={this.handleInputChange}/>
      <TextField name='values.batch' fullWidth label='Batch' value={this.checkOverrideValueDefault('values.batch', '')} onChange={this.handleInputChange}/>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault('notes', '')} multiline={true} rows={3} onChange={this.handleInputChange}/>
      <IIIFTagEditor name='tags' modelName='manifest' suggestions={manifestTagSuggestions} value={this.checkOverrideValueDefault('tags', [])} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export class ManifestTitle extends React.Component {
  render() {
    const {className, manifest} = this.props

    const {label} = manifest || {label: 'Manifest'}
    return <Typography variant='body2' classes={{body2: className}}>{label}</Typography>
  }
}

const manifestBriefStyles = {
  root: {
  },
}

export const ManifestBrief = flow(withStyles(manifestBriefStyles))(class ManifestBrief extends React.Component {
  static propTypes = {
  }

  static defaultProps = {
    onItemPicked(id) {},
  }

  handleOnClick = event => {
    event.preventDefault()
    const {onItemPicked, manifest} = this.props
    if (manifest) {
      onItemPicked(manifest.id)
    }
  }

  render() {
    const {className, classes, manifest} = this.props

    const {label} = manifest || {label: 'Manifest'}
    return <Paper className={classnames(classes.root, className)} onClick={this.handleOnClick}>
      <Typography>{label}</Typography>
    </Paper>
  }
})

class ManifestPick extends React.Component {
  render() {
    const {className, collection, manifests, manifest, onItemPicked} = this.props
    if (!collection) return <Typography>Please select a collection.</Typography>
    return <ExpandoList className={className} items={manifests} selectedItem={manifest} IconLabel='Manifest' onItemPicked={onItemPicked}/>
  }
}

export const ManifestPanel = flow(picked(['collection', 'manifest']), userPicked('permissions'))(class ManifestPanel extends React.Component {
  state = {}

  static getDerivedStateFromProps = getDerivedStateFromProps

  render() {
    const {className, collection, manifests, onItemPicked, updateManifest, permissions, ...props} = this.props
    const {manifest} = this.state

    if (!collection) return <div/>
    return <ItemPanel
      className={className}
      name='manifest'
      title={<ManifestTitle manifest={manifest}/>}
      brief={<ManifestBrief manifest={manifest}/>}
      pick={<ManifestPick collection={collection} manifests={manifests} manifest={this.props.manifest} onItemPicked={onItemPicked}/>}
      icon={<CollectionsIcon/>}
      showForm={checkPermission(permissions, null, 'manifest', 'form')}
      form={<ManifestForm {...props} permissions={permissions} manifest={manifest} updateManifest={updateManifest}/>}
      busy={manifest && manifest._busy}
    />
  }
})
