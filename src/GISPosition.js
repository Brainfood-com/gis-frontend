import React from 'react'

import { withStyles } from 'material-ui/styles'

import Paper from 'material-ui/Paper'
import Typography from 'material-ui/Typography'

import Relider from 'relider'

const styles = {
  root: {
    maxHeight: 200,
  },
}
class GISPosition extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      position: 0,
    }
  }

	handleOnChange = (handles) => {
    const position = handles[0]
    this.setState({position})
  }

  render() {
    const {children, classes} = this.props
    const {position} = this.state
    return <Paper className={classes.root}>
      <Typography variant='title'>Position</Typography>
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
              {position}
            ]}
            onChange={this.handleOnChange}
          />

    </Paper>
  }
}

export default withStyles(styles)(GISPosition)
