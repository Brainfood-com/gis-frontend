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

const structureDetailStyles = {
  root: {
  },
  hidden: {
    display: 'none',
  },
}

export const StructureDetail = withStyles(structureDetailStyles)(class StructureDetail extends React.Component {
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
  }

  componentWillMount() {
    this.setState(this.processProps(this.state, {}, this.props))
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.processProps(this.state, this.props, nextProps))
  }

  processProps(prevState, prevProps, nextProps) {
    return ['fieldOfView', 'placement'].reduce((result, name) => {
      const {[name]: prevValue} = prevProps
      const {[name]: nextValue} = nextProps
      if (prevValue !== nextValue) {
        result[name] = nextValue
      }
      return result
    }, {})
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
      const {structure, onUpdate} = props
      const {fieldOfView, placement} = prevState
      console.log('update', prevState, this.state, fieldOfView, placement)
      onUpdate(structure, {fieldOfView, placement})
    })
  }

  render() {
    const {className, classes, structure, onRemoveOverride} = this.props
    const {fieldOfView, placement} = this.state
    const rootClasses = {
      [classes.root]: true,
      [classes.hidden]: !!!structure,
    }

    return <Paper className={classnames(rootClasses, className)}>
      <Typography variant='headline'>Structure</Typography>
      <FormControl inline>
        <FormLabel>Placement</FormLabel>
        <RadioGroup name='placement' value={placement} onChange={this.handleInputChange}>
          <FormControlLabel value='left' control={<Radio color='primary' />} label='Left'/>
          <FormControlLabel value='right' control={<Radio color='primary' />} label='Right'/>
        </RadioGroup>
      </FormControl>
      <TextField name='fieldOfView' label='Field of View(degrees)' value={fieldOfView} onChange={this.handleInputChange}/>
      <TextField fullWidth label='Notes' multiline={true} rows={5}/>
    </Paper>
  }
})
