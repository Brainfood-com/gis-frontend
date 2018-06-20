import _ from 'lodash'
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

const manifestFormStyles = {
  root: {
  },
}

const fieldInputProcessors = {
  tags(value) {
    return value.split(/\n+/)
  },
}
export const ManifestForm = _.flow(picked(['manifest']), withStyles(manifestFormStyles))(class ManifestForm extends React.Component {
  static defaultProps = {
    updateManifest(id, data) {},
  }

  handleInputChange = event => {
    const {manifest, updateManifest} = this.props
    const {name, value} = event.currentTarget
    const {[name]: inputProcessor = value => value} = fieldInputProcessors
    const processedValue = inputProcessor(value)
    const currentValue = manifest.get(name)
    if (currentValue !== processedValue) {
      updateManifest(manifest.get('id'), {[name]: processedValue})
    }
  }

  render() {
    const {className, classes, manifest, onRemoveOverride} = this.props
    if (!manifest) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <TextField name='notes' fullWidth label='Notes' value={manifest.get('notes') || ''} multiline={true} rows={3} onChange={this.handleInputChange}/>
      <TextField name='tags' fullWidth label='Tags' value={manifest.get('tags', []).join("\n")} multiline={true} rows={3} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export const ManifestPick = picked(['collection', 'manifest'])(class ManifestPick extends React.Component {
  render() {
    const {className, collection, manifests, manifest, onItemPicked} = this.props
    if (!collection) return <div/>
    return <ExpandoList className={className} items={manifests} selectedItem={manifest} Icon={<div/>} IconLabel='Manifest' onItemPicked={onItemPicked}/>
  }
})

export const ManifestPanel = picked(['collection', 'manifest'])(class ManifestPanel extends React.Component {
  render() {
    const {className, collection, manifests, manifest} = this.props

    if (!collection) return <div/>
    return <ItemPanel className={className} name='manifest' title='Manifest' pick={<ManifestPick/>} form={<ManifestForm/>}/>
  }
})
