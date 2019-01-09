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
import DebouncedForm from '../DebouncedForm'
import {checkPermissions, picked as userPicked} from '../User'
import IIIFTagEditor, {commonTagDefinitions} from './Tags'

const manifestFormStyles = {
  root: {
  },
}

const fieldInputProcessors = {
}

const manifestTagSuggestions = [
  commonTagDefinitions.CLAIMED,
]

function getDerivedStateFromProps(props, state) {
  const {manifest} = props
  return {manifest: manifest instanceof imMap ? manifest.toJS() : manifest}
}

export const ManifestForm = flow(userPicked('permissions'), withStyles(manifestFormStyles))(class ManifestForm extends DebouncedForm {
  static defaultProps = {
    updateManifest(id, data) {},
  }

  getValue(model, name) {
    return model[name]
  }

  flushInputChange = (name, value, checked) => {
    const {manifest, updateManifest} = this.props
    const processedValue = this.processFieldInput(name, value, checked)
    const currentValue = this.getValue(manifest, name)
    if (currentValue !== processedValue) {
      updateManifest(manifest.id, {[name]: processedValue})
    }
  }

  skipChange = (name, value, checked) => {
    if (name === 'tags') {
      return false
    }
    const {permissions} = this.props
    return !checkPermissions(permissions, 'editor', 'manifest', name)
  }

  processFieldInput(name, value, checked) {
    const {[name]: inputProcessor = value => value} = fieldInputProcessors
    return inputProcessor(value, checked)
  }

  render() {
    const {className, classes, manifest, onRemoveOverride} = this.props
    if (!manifest) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault(manifest, 'notes', '')} multiline={true} rows={3} onChange={this.handleInputChange}/>
      <IIIFTagEditor name='tags' modelName='manifest' suggestions={manifestTagSuggestions} value={this.checkOverrideValueDefault(manifest, 'tags', [])} onChange={this.handleInputChange}/>
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

export const ManifestPanel = picked(['collection', 'manifest'])(class ManifestPanel extends React.Component {
  state = {}

  static getDerivedStateFromProps = getDerivedStateFromProps

  render() {
    const {className, collection, manifests, onItemPicked, updateManifest} = this.props
    const {manifest} = this.state

    if (!collection) return <div/>
    const title = manifest ? manifest.label : 'Manifest'
    return <ItemPanel
      className={className}
      name='manifest'
      title={title}
      pick={<ManifestPick collection={collection} manifests={manifests} manifest={this.props.manifest} onItemPicked={onItemPicked}/>}
      icon={<CollectionsIcon/>}
      form={<ManifestForm manifest={manifest} updateManifest={updateManifest}/>}
      busy={manifest && manifest._busy}
    />
  }
})
