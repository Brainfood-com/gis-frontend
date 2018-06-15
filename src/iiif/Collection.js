import _ from 'lodash'
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

const collectionFormStyles = {
  root: {
  },
}

const fieldInputProcessors = {
  tags(value) {
    return value.split(/\n+/)
  },
}
export const CollectionForm = _.flow(picked(['collection']), withStyles(collectionFormStyles))(class CollectionForm extends React.Component {
  static defaultProps = {
    updateCollection(id, data) {},
  }

  handleInputChange = event => {
    const {collection, updateCollection} = this.props
    const {name, value} = event.currentTarget
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
      <TextField name='notes' fullWidth label='Notes' value={collection.get('notes') || ''} multiline={true} rows={3} onChange={this.handleInputChange}/>
      <TextField name='tags' fullWidth label='Tags' value={collection.get('tags', []).join("\n")} multiline={true} rows={3} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export const CollectionPick = picked(['root', 'collection'])(class CollectionPick extends React.Component {
  render() {
    const {className, collections, onItemPicked, collection} = this.props
    return <ExpandoList className={className} items={collections} selectedItem={collection} Icon={<CollectionsIcon/>} IconLabel='Collection' onItemPicked={onItemPicked}/>
  }
})

