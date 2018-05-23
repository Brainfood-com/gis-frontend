import React from 'react'

import { withStyles } from '@material-ui/core/styles'

import Typography from '@material-ui/core/Typography'

import GISMap from './GISMap'
import GISPicView from './GISPicView'
import GISPosition from './GISPosition'

import {IIIFTree, CanvasList} from './IIIF'
import {makeUrl} from './api'

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
    flexDirection: 'column',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
    height: '100%',
  },
  mapViewLeft: {
    width: '20%',
    maxWidth: '20%',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  mapViewMiddle: {
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
    width: '100%',
  },
  mapViewRight: {
    maxWidth: '25%',
    minWidth: 100,
  },
  mapViewBottom: {
    width: '100%',
    minHeight: '10%',
    maxHeight: '15%',
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

  handleOnCanvasList = canvasList => {
    this.setState({canvasList})
  }

  render() {
    const {children, classes} = this.props
    const {canvasList, position} = this.state
    return <div className={classes.root}>
      <div className={classes.mapViewTop}>
        <div className={classes.mapViewLeft}>
          <IIIFTree onCanvasList={this.handleOnCanvasList}/>
        </div>
        <div className={classes.mapViewMiddle}>
          <GISMap position={position} canvasList={canvasList}/>
        </div>
        <div className={classes.mapViewRight}>
          <GISPicView/>
        </div>
      </div>
      <div className={classes.mapViewBottom}>
        <GISPosition position={position} onPositionChange={this.handleOnPositionChange}/>
        <CanvasList canvasList={canvasList}/>
      </div>
    </div>
  }
}

export default withStyles(styles)(GISControl)
