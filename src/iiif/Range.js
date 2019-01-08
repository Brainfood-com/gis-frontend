import {Map as imMap} from 'immutable'
import flow from 'lodash-es/flow'
import React from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { withStyles } from '@material-ui/core/styles'
import CameraRollIcon from '@material-ui/icons/CameraRoll'
import Button from '@material-ui/core/Button'
import Checkbox from '@material-ui/core/Checkbox';
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
import DebouncedForm from '../DebouncedForm'
import {checkPermissions, picked as userPicked} from '../User'
import IIIFTagEditor, {commonTagDefinitions} from './Tags'
import {immutableEmptyList} from '../constants'

export function approvedRangePermissionCheck(range, permissions, modelName, fieldName) {
  const {tags} = range
  const isClientApproved = tags.indexOf('Client Approved') !== -1
  return checkPermissions(permissions, isClientApproved ? 'client' : 'editor', modelName, fieldName)
}

const rangeFormStyles = {
  root: {
  },
  numberTextField: {
    width: '50%',
  },
}

const fieldInputProcessors = {
  reverse(value, checked) {
    return checked
  },
  fovAngle(value) {
    return value === '' ? null : parseInt(value)
  },
  fovDepth(value) {
    return value === '' ? null : parseInt(value)
  },
}

const rangeTagSuggestions = [
  commonTagDefinitions.CLAIMED,
  commonTagDefinitions.RANDOM_IMAGES,
  commonTagDefinitions.DISJOINT_SEQUENCE,
  commonTagDefinitions.ROUTING_GLITCH,
  commonTagDefinitions.NEEDS_REVIEW,
  commonTagDefinitions.PLACED,
  commonTagDefinitions.VALIDATED,
  commonTagDefinitions.CLIENT_APPROVED,
]

function getDerivedStateFromProps(props, state) {
  const {range} = props
  return {range: range instanceof imMap ? range.toJS() : range}
}

export const RangeForm = flow(userPicked('permissions'), withStyles(rangeFormStyles))(class RangeForm extends DebouncedForm {
  static defaultProps = {
    updateRange(id, data) {},
  }

  state = {}

  static getDerivedStateFromProps = getDerivedStateFromProps

  getValue(model, name) {
    return model[name]
  }

  flushInputChange = (name, value, checked) => {
    const {updateRange} = this.props
    const {range} = this.state
    const {[name]: inputProcessor = (value, checked) => value} = fieldInputProcessors
    const processedValue = inputProcessor(value, checked)
    const currentValue = range[name]
    if (currentValue !== processedValue) {
      updateRange(range.id, {[name]: processedValue})
    }
  }

  skipChange = (name, value, checked) => {
    if (name === 'tags') {
      debugger
      return false
    }
    const {permissions} = this.props
    const {range} = this.state
    return !approvedRangePermissionCheck(range, permissions, 'range', name)
  }

  render() {
    const {className, classes} = this.props
    const {range} = this.state
    if (!range) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <Button fullWidth variant='raised' target='blank' href={makeUrl('api', `range/${range.id}/geoJSON`)}>Get GeoJSON</Button>
      <FormGroup row>
        <FormControlLabel label='Reverse' control={
          <Checkbox name='reverse' checked={!!this.checkOverrideValueDefault(range, 'reverse', fieldInputProcessors, false)} onChange={this.handleInputChange}/>
        }/>
      </FormGroup>
      <FormControl>
        <FormLabel>Orientation</FormLabel>
        <RadioGroup row name='fovOrientation' value={range.fovOrientation} onChange={this.handleInputChange} margin='dense'>
          <FormControlLabel value='left' control={<Radio color='primary' />} label='Left' margin='dense'/>
          <FormControlLabel value='right' control={<Radio color='primary' />} label='Right' margin='dense'/>
        </RadioGroup>
      </FormControl>
      <FormControl>
        <FormGroup row>
          <TextField className={classes.numberTextField} name='fovAngle' label='Angle(degrees)' value={this.checkOverrideValueDefault(range, 'fovAngle', fieldInputProcessors, 60)} onChange={this.handleInputChange} margin='dense'/>
          <TextField className={classes.numberTextField} name='fovDepth' label='Depth(meters?)' value={this.checkOverrideValueDefault(range, 'fovDepth', fieldInputProcessors, 100)} onChange={this.handleInputChange} margin='dense'/>
        </FormGroup>
      </FormControl>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault(range, 'notes', fieldInputProcessors, '')} multiline={true} rows={3} onChange={this.handleInputChange} margin='dense'/>
      <IIIFTagEditor name='tags' modelName='range' suggestions={rangeTagSuggestions} value={this.checkOverrideValueDefault(range, 'tags', fieldInputProcessors, [])} onChange={this.handleInputChange}/>
    </Paper>
  }
})

const rangeBriefStyles = {
  root: {
  },
}

export const RangeBrief = flow(withStyles(rangeBriefStyles))(class RangeBrief extends React.Component {
  state = {}
  static getDerivedStateFromProps = getDerivedStateFromProps

  static propTypes = {
  }

  static defaultProps = {
    onItemPicked(id) {},
  }

  handleOnClick = event => {
    event.preventDefault()
    const {onItemPicked} = this.props
    const {range} = this.state
    onItemPicked(range.id)
  }

  render() {
    const {className, classes} = this.props
    const {range} = this.state
    if (!range) {
      return <div />
    }

    const {id, label} = range
    return <Paper className={classnames(classes.root, className)} onClick={this.handleOnClick}>
      <Typography>rangeId:{id}</Typography>
      <Typography>{label}</Typography>
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
    const {className, manifest, rangesWithCanvases, range, ...props} = this.props

    if (!manifest) return <div/>
    const title = range ? range.get('label') : 'Range'
    return <ItemPanel className={className} name='range' title={title} pick={<RangePick/>} icon={<CameraRollIcon/>} form={<RangeForm {...props} range={range}/>} busy={range && range.get('_busy')}/>
  }
})
