import _ from 'lodash'
import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormLabel from '@material-ui/core/FormLabel'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import classnames from 'classnames'

import connectHelper from '../connectHelper'
import * as iiifRedux from './redux'
import {safeGetImmutableId} from '../api'
import {AbstractDetail} from './base'

const rangeDetailStyles = {
  root: {
  },
  hidden: {
    display: 'none',
  },
}


const rangeDetailRedux = {
  mapStateToProps(store, props) {
    const id = safeGetImmutableId(props.item)
    const range = store.iiif.getIn([iiifRedux.MODEL['sc:Range'], id])
    return {range}
  },
  mapDispatchToProps: {
    getItem: iiifRedux.getRange,
    updateRange: iiifRedux.updateRange,
  },
}
/*
const RangeDetail = _.flow(connectHelper(rangeDetailRedux), withStyles(rangeStyles))(class RangeDetail extends AbstractDetail {
  _type = 'structure'

  render() {
    const {classes, className, range} = this.props
    const label = range.get('label')
    return <div className={classnames(classes.root, className)}>
      <Typography className={classes.header}>{label}</Typography>
    </div>
  }
})
*/



export const RangeDetail = _.flow(connectHelper(rangeDetailRedux), withStyles(rangeDetailStyles))(class RangeDetail extends React.Component {
  static defaultProps = {
    onUpdate(structure, data) {},
    placement: 'left',
  }

  static propTypes = {
    placement: PropTypes.oneOf(['left', 'right']),
  }

  constructor(props) {
    super(props)
    this.state = {}
    this._type = 'range'
  }

  componentWillMount() {
    //super.componentWillMount()
    this.processProps(this.state, {}, this.props)
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps)
    this.processProps(this.state, this.props, nextProps)
  }

  processProps(prevSate, prevProps, nextProps) {
    const {range} = nextProps
    if (prevProps.range !== range) {
      const {notes, fovAngle, fovDepth, fovOrientation} = (range ? range.toJSON() : {})
      this.setState({notes, fovAngle, fovDepth, fovOrientation})
    }
  }

  handleInputChange = event => {
    const {name, value} = event.currentTarget
    const {[name]: currentValue} = this.state
    console.log('handleInputChange', name, value, currentValue)
    if (currentValue !== value) {
      this.setState({[name]: value})
      this.onUpdate()
    }
  }

  onUpdate() {
    this.setState((prevState, props) => {
      const {range, updateRange} = props
      const {notes, fovAngle, fovDepth, fovOrientation} = prevState
      updateRange(range.get('id'), {notes, fovAngle, fovDepth, fovOrientation})
    })
  }

  render() {
    const {className, classes, range, onRemoveOverride} = this.props
    if (!range) return <div/>
    const {notes, fovAngle, fovDepth, fovOrientation} = this.state
    const rootClasses = {
      [classes.root]: true,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <Typography variant='headline'>Range</Typography>
      <FormControl inline>
        <FormLabel>Orientation</FormLabel>
        <RadioGroup name='fovOrientation' value={fovOrientation} onChange={this.handleInputChange}>
          <FormControlLabel value='left' control={<Radio color='primary' />} label='Left'/>
          <FormControlLabel value='right' control={<Radio color='primary' />} label='Right'/>
        </RadioGroup>
      </FormControl>
      <TextField name='fovAngle' label='Angle(degrees)' value={fovAngle} onChange={this.handleInputChange}/>
      <TextField name='fovDepth' label='Depth(meters?)' value={fovDepth} onChange={this.handleInputChange}/>
      <TextField name='notes' fullWidth label='Notes' value={notes} multiline={true} rows={5} onChange={this.handleInputChange}/>
    </Paper>
  }
})
