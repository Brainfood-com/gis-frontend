import React from 'react'
import PropTypes from 'prop-types'
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

import connectHelper from '../connectHelper'
import * as iiifRedux from './redux'
import {picked} from './Picked'

const rangeFormStyles = {
  root: {
  },
  numberTextField: {
    width: '50%',
  },
}

const fieldInputProcessors = {
  fovAngle(value) {
    return parseInt(value)
  },
  fovDepth(value) {
    return parseInt(value)
  },
  tags(value) {
    return value.split(/\n+/)
  },
}
export const RangeForm = withStyles(rangeFormStyles)(class RangeForm extends React.Component {
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
      <Typography variant='subheading'>{range.get('label')}</Typography>
      <FormControl>
        <FormLabel>Orientation</FormLabel>
        <RadioGroup row name='fovOrientation' value={range.get('fovOrientation')} onChange={this.handleInputChange} margin='dense'>
          <FormControlLabel value='left' control={<Radio color='primary' />} label='Left' margin='dense'/>
          <FormControlLabel value='right' control={<Radio color='primary' />} label='Right' margin='dense'/>
        </RadioGroup>
      </FormControl>
      <FormControl>
        <FormGroup row>
          <TextField className={classes.numberTextField} name='fovAngle' label='Angle(degrees)' value={range.get('fovAngle')} onChange={this.handleInputChange} margin='dense'/>
          <TextField className={classes.numberTextField} name='fovDepth' label='Depth(meters?)' value={range.get('fovDepth')} onChange={this.handleInputChange} margin='dense'/>
        </FormGroup>
      </FormControl>
      <TextField name='notes' fullWidth label='Notes' value={range.get('notes')} multiline={true} rows={3} onChange={this.handleInputChange} margin='dense'/>
      <TextField name='tags' fullWidth label='Tags' value={range.get('tags', []).join("\n")} multiline={true} rows={3} onChange={this.handleInputChange} margin='dense'/>
    </Paper>
  }
})

export const RangeTree = picked(['range'])(class RangeTree extends React.Component {
  render() {
    const {className, range, onItemPicked, updateRange} = this.props
    if (!range) return <div/>
    return <div className={className}>
      <RangeForm range={range} updateRange={updateRange}/>
    </div>
  }
})
