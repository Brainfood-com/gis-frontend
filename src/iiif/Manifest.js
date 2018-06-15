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

const manifestFormStyles = {
  root: {
  },
}

const fieldInputProcessors = {
  tags(value) {
    return value.split(/\n+/)
  },
}
export const ManifestForm = withStyles(manifestFormStyles)(class ManifestForm extends React.Component {
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
      <Typography variant='subheading'>{manifest.get('label')}</Typography>
      <TextField name='notes' fullWidth label='Notes' value={manifest.get('notes')} multiline={true} rows={3} onChange={this.handleInputChange}/>
      <TextField name='tags' fullWidth label='Tags' value={manifest.get('tags', []).join("\n")} multiline={true} rows={3} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export const ManifestTree = picked(['manifest', 'range'])(class ManifestTree extends React.Component {
  render() {
    const {className, manifest, rangesWithCanvases, range, onItemPicked, updateOwner} = this.props
    if (!manifest) return <div/>
      //<ManifestForm manifest={manifest} updateManifest={updateOwner}/>
    return <div className={className}>
      <Typography variant='headline'>Range</Typography>
      <ExpandoList items={rangesWithCanvases} selectedItem={range} Icon={<div/>} IconLabel='Range' onItemPicked={onItemPicked}/>
    </div>
  }
})
