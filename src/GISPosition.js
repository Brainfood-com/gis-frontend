import React from 'react'

import { withStyles } from '@material-ui/core/styles'

import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'

import Relider from 'relider'

const styles = {
  root: {
    maxHeight: 50,
  },
}
class GISPosition extends React.Component {
  static defaultProps = {
    onPositionChange: function(position) {},
  }

  constructor(props) {
    super(props)
    this.state = this.processProps(props, {
      position: 0,
    })
  }

  processProps(nextProps, state) {
    const {position} = nextProps
    return {...state, position}
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.processProps(nextProps, this.state))
  }

	handleOnChange = (handles) => {
    const {onPositionChange} = this.props
    const position = handles[0].value
    this.setState({position})
    onPositionChange(position)
  }

  render() {
    const {children, classes} = this.props
    const {position} = this.state
    return <Paper className={classes.root}>
          <Relider
            onDragStop={this.handleOnDragStop}
            style={{height: 200}}
            sliderStyle={{foobar: 'baz', marginBottom: 5, marginTop: 5, marginRight: 5, marginLeft: 5}}
            horizontal={true}
            reversed={false}
            min={0}
            max={100}
            step={1}
            handles={[
              {value: position}
            ]}
            onChange={this.handleOnChange}
          />

    </Paper>
  }
}

export default withStyles(styles)(GISPosition)
