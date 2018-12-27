import {Map as imMap} from 'immutable'
import flow from 'lodash-es/flow'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
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

export const ManifestForm = flow(withStyles(manifestFormStyles))(class ManifestForm extends DebouncedForm {
  static defaultProps = {
    updateManifest(id, data) {},
  }

  static getDerivedStateFromProps = getDerivedStateFromProps

  getValue(model, name) {
    return model[name]
  }

  flushInputChange = (name, value, checked) => {
    const {updateManifest} = this.props
    const {manifest} = this.state
    const {[name]: inputProcessor = value => value} = fieldInputProcessors
    const processedValue = inputProcessor(value)
    const currentValue = manifest[name]
    if (currentValue !== processedValue) {
      updateManifest(manifest.id, {[name]: processedValue})
    }
  }

  render() {
    const {className, classes, onRemoveOverride} = this.props
    const {manifest} = this.state
    if (!manifest) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault(manifest, 'notes', fieldInputProcessors, '')} multiline={true} rows={3} onChange={this.handleInputChange}/>
      <IIIFTagEditor name='tags' suggestions={manifestTagSuggestions} value={this.checkOverrideValueDefault(manifest, 'tags', fieldInputProcessors, [])} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export const ManifestPick = picked(['collection', 'manifest'])(class ManifestPick extends React.Component {
  render() {
    const {className, collection, manifests, manifest, onItemPicked} = this.props
    if (!collection) return <Typography>Please select a collection.</Typography>
    return <ExpandoList className={className} items={manifests} selectedItem={manifest} IconLabel='Manifest' onItemPicked={onItemPicked}/>
  }
})

export const ManifestPanel = picked(['collection', 'manifest'])(class ManifestPanel extends React.Component {
  render() {
    const {className, collection, manifests, manifest, ...props} = this.props

    if (!collection) return <div/>
    const title = manifest ? manifest.get('label') : 'Manifest'
    return <ItemPanel className={className} name='manifest' title={title} pick={<ManifestPick/>} form={<ManifestForm {...props} manifest={manifest}/>} busy={manifest && manifest.get('_busy')}/>
  }
})
