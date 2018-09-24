import flow from 'lodash-es/flow'
import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormGroup from '@material-ui/core/FormGroup'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormLabel from '@material-ui/core/FormLabel'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import classnames from 'classnames'

import ExpandoList from '../ExpandoList'
import connectHelper from '../connectHelper'
import * as iiifRedux from './redux'
import {picked} from './Picked'
import ItemPanel from '../ItemPanel'
import {makeUrl} from '../api'

const rangeFormStyles = {
  root: {
  },
  numberTextField: {
    width: '50%',
  },
}

const fieldInputProcessors = {
  fovAngle(value) {
    return value === '' ? null : parseInt(value)
  },
  fovDepth(value) {
    return value === '' ? null : parseInt(value)
  },
  tags(value) {
    return value.split(/\n+/)
  },
}

const notSetDefault = (value, def) => value === null || value === undefined ? def : value

export const RangeForm = flow(picked(['range']), withStyles(rangeFormStyles))(class RangeForm extends React.Component {
  static defaultProps = {
    updateRange(id, data) {},
  }

  handleInputChange = event => {
    const {range, updateRange} = this.props
    const {name, value} = event.currentTarget
    const {[name]: inputProcessor = value => value} = fieldInputProcessors
    const processedValue = inputProcessor(value)
    const currentValue = range.get(name)
    console.log('handleInputChange', range.toJSON(), name, value, processedValue, currentValue)
    if (currentValue !== processedValue) {
      updateRange(range.get('id'), {[name]: processedValue})
    }
  }

  render() {
    const {className, classes, range, onRemoveOverride} = this.props
    if (!range) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <Button fullWidth variant='raised' target='blank' href={makeUrl('api', `range/${range.get('id')}/geoJSON`)}>Get GeoJSON</Button>
      <FormControl>
        <FormLabel>Orientation</FormLabel>
        <RadioGroup row name='fovOrientation' value={range.get('fovOrientation')} onChange={this.handleInputChange} margin='dense'>
          <FormControlLabel value='left' control={<Radio color='primary' />} label='Left' margin='dense'/>
          <FormControlLabel value='right' control={<Radio color='primary' />} label='Right' margin='dense'/>
        </RadioGroup>
      </FormControl>
      <FormControl>
        <FormGroup row>
          <TextField className={classes.numberTextField} name='fovAngle' label='Angle(degrees)' value={notSetDefault(range.get('fovAngle'), 60)} onChange={this.handleInputChange} margin='dense'/>
          <TextField className={classes.numberTextField} name='fovDepth' label='Depth(meters?)' value={notSetDefault(range.get('fovDepth'), 100)} onChange={this.handleInputChange} margin='dense'/>
        </FormGroup>
      </FormControl>
      <TextField name='notes' fullWidth label='Notes' value={notSetDefault(range.get('notes'), '')} multiline={true} rows={3} onChange={this.handleInputChange} margin='dense'/>
      <TextField name='tags' fullWidth label='Tags' value={notSetDefault(range.get('tags'), []).join("\n")} multiline={true} rows={3} onChange={this.handleInputChange} margin='dense'/>
    </Paper>
  }
})

export const RangePick = picked(['manifest', 'range'])(class RangePick extends React.Component {
  render() {
    const {className, manifest, rangesWithCanvases, range, onItemPicked, updateOwner} = this.props
    if (!manifest) return <Typography>Please select a manifest.</Typography>
    return <ExpandoList className={className} items={rangesWithCanvases} selectedItem={range} IconLabel='Range' onItemPicked={onItemPicked}/>
  }
})

export const RangePanel = picked(['manifest', 'range'])(class RangePanel extends React.Component {
  render() {
    const {className, manifest, rangesWithCanvases, range} = this.props

    if (!manifest) return <div/>
    const title = range ? range.get('label') : 'Range'
    return <ItemPanel className={className} name='range' title={title} pick={<RangePick/>} form={<RangeForm/>} busy={range && range.get('_busy')}/>
  }
})
