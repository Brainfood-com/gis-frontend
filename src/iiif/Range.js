import {Collection as imCollection, List as imList, Map as imMap} from 'immutable'
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
import {checkPermission, picked as userPicked} from '../User'
import IIIFTagEditor, {commonTagDefinitions} from './Tags'
import {immutableEmptyList, immutableEmptyMap, immutableEmptyOrderedMap} from '../constants'
import { AbstractForm } from './base'
import { ManifestShape, RangeStatusShape, RangeShape, RangesShape } from './Types'

export function rangeRequiredRole(range = immutableEmptyMap) {
  const tags = range.get('tags', immutableEmptyList)
  const isClientApproved = tags.indexOf('Client Approved') !== -1
  return isClientApproved ? 'client' : 'editor'
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
const rangeBfTagSuggestions = [
  commonTagDefinitions.BF_PAID,
  commonTagDefinitions.BF_TRAINING_EXAMPLE,
]

const RangeForm = flow(withStyles(rangeFormStyles))(class RangeForm extends AbstractForm {
  static modelName = 'range'
  static fieldInputProcessors = fieldInputProcessors
  static updaterName = 'updateRange'
  static complexFields = ['tags', 'values.bftags']
  static propTypes = {
    range: RangeShape,
    updateRange: PropTypes.func,
  }

  requiredRole() {
    const {range} = this.props
    return rangeRequiredRole(range)
  }

  render() {
    const {className, classes, range, permissions} = this.props
    if (!range) return <div/>
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <FormGroup row>
        <FormControlLabel label='Reverse' control={
          <Checkbox name='reverse' checked={!!this.checkOverrideValueDefault('reverse', false)} onChange={this.handleInputChange}/>
        }/>
      </FormGroup>
      <FormControl>
        <FormLabel>Orientation</FormLabel>
        <RadioGroup row name='fovOrientation' value={range.get('fovOrientation')} onChange={this.handleInputChange} margin='dense'>
          <FormControlLabel value='left' control={<Radio color='primary' />} label='Left' margin='dense'/>
          <FormControlLabel value='right' control={<Radio color='primary' />} label='Right' margin='dense'/>
        </RadioGroup>
      </FormControl>
      <FormControl>
        <FormGroup row>
          <TextField className={classes.numberTextField} name='fovAngle' label='Angle(degrees)' value={this.checkOverrideValueDefault('fovAngle', 30)} onChange={this.handleInputChange} margin='dense'/>
          <TextField className={classes.numberTextField} name='fovDepth' label='Depth(meters?)' value={this.checkOverrideValueDefault('fovDepth', 70)} onChange={this.handleInputChange} margin='dense'/>
        </FormGroup>
      </FormControl>
      <TextField name='notes' fullWidth label='Notes' value={this.checkOverrideValueDefault('notes', '')} multiline={true} rows={3} onChange={this.handleInputChange} margin='dense'/>
      {checkPermission(permissions, null, 'brainfood', 'admin')
        ? <IIIFTagEditor name='values.bftags' label='Brainfood Tags' modelName='range' suggestions={rangeBfTagSuggestions} value={this.checkOverrideValueDefault('values.bftags', immutableEmptyList)} onChange={this.handleInputChange}/>
        : null
      }
      <IIIFTagEditor name='tags' modelName='range' suggestions={rangeTagSuggestions} value={this.checkOverrideValueDefault('tags', immutableEmptyList)} onChange={this.handleInputChange}/>
    </Paper>
  }
})

export class RangeTitle extends React.Component {
  static propTypes = {
    range: RangeShape,
  }

  render() {
    const {className, range} = this.props
    if (!range) return <div/>

    const label = range.get('label')
    return <Typography variant='body1' classes={{body1: className}}>{label}</Typography>
  }
}

const rangeBriefStyles = {
  root: {
  },
}

export const RangeBrief = flow(withStyles(rangeBriefStyles), userPicked('permissions'))(class RangeBrief extends React.Component {
  static propTypes = {
    range: RangeShape,
    onItemPicked: PropTypes.func.isRequired,
  }

  handleOnClick = event => {
    event.preventDefault()
    const {onItemPicked, range} = this.props
    const id = range.get('id')
    if (id !== undefined) {
      onItemPicked(id)
    }
  }

  render() {
    const {className, classes, range, permissions} = this.props
    if (!range || !range.get('id')) {
      return <div />
    }

    const id = range.get('id')
    const label = range.get('label')
    return <Paper className={classnames(classes.root, className)} onClick={this.handleOnClick}>
      <Typography>{label}</Typography>
      {checkPermission(permissions, null, 'range', 'get_geojson') ? <Button fullWidth variant='contained' target='blank' href={makeUrl('api', `range/${id}/geoJSON`)}>Get GeoJSON</Button> : null}
    </Paper>
  }
})

class RangePick extends React.Component {
  static propTypes = {
    manifest: ManifestShape,
    range: RangeShape,
    ranges: RangesShape,
    onItemPicked: PropTypes.func
  }

  render() {
    const {manifest, ranges, range, onItemPicked} = this.props
    if (!manifest) return <Typography>Please select a manifest.</Typography>
    return <ExpandoList itemList={manifest.get('rangesWithCanvases')} itemMap={ranges} selectedItem={range} IconLabel='Range' onItemPicked={onItemPicked}/>
  }
}

export const RangePanel = flow(picked(['manifest', 'range']), userPicked('permissions'))(class RangePanel extends React.Component {
  static propTypes = {
    manifest: ManifestShape,
    range: RangeShape,
    ranges: RangesShape,
    rangeStatus: RangeStatusShape,
    onItemPicked: PropTypes.func,
    updateRange: PropTypes.func,
  }

  static defaultProps = {
    onItemPicked(id) {},
    updateRange(id, data) {},
  }

  render() {
    const {className, manifest, range, ranges, rangeStatus, onItemPicked, updateRange, permissions, ...props} = this.props

    if (!manifest) return <div/>
    return <ItemPanel
      className={className}
      name='range'
      title={<RangeTitle range={range}/>}
      brief={<RangeBrief range={range} onItemPicked={onItemPicked}/>}
      pick={<RangePick manifest={manifest} ranges={ranges} range={range} onItemPicked={onItemPicked}/>}
      icon={<CameraRollIcon/>}
      showForm={checkPermission(permissions, null, 'range', 'form')}
      form={<RangeForm {...props} permissions={permissions} range={range} updateRange={updateRange}/>}
      busy={rangeStatus.get('busy')}
    />
  }
})
