import React from 'react'

import { withStyles } from 'material-ui/styles'

import Typography from 'material-ui/Typography'

import GISMap from './GISMap'
import GISPicView from './GISPicView'
import GISPosition from './GISPosition'

/*
 *  /---------------+--------\
 *  |left|          |pic-view|
 *  |    +----------+--------+
 *  |    |timeline           |
 *  \----+-------------------/
 */
const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
    height: '100%',
  },
  left: {
    maxWidth: 200,
  },
  mapViewRoot: {
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
  },
  mapViewTop: {
    display: 'flex',
    flexDirection: 'row',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
  },
}
class GISControl extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      position: 50,
    }
  }

  handleOnPositionChange = (position) => {
    this.setState({position})
  }

  render() {
    const {children, classes} = this.props
    const {position} = this.state
    return <div className={classes.root}>
      <div className={classes.left}>
        <Typography variant='title'>left</Typography>
      </div>
      <div className={classes.mapViewRoot}>
        <div className={classes.mapViewTop}>
          <GISMap position={position}/>
          <GISPicView/>
        </div>
        <GISPosition position={position} onPositionChange={this.handleOnPositionChange}/>
      </div>
    </div>
  }
}

export default withStyles(styles)(GISControl)
