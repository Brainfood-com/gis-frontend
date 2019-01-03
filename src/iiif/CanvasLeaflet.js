import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'

import IIIFViewer from 'react-leaflet-iiif-viewer'
import {createScrollHandler} from '../ScrollHelper'

const canvasLeafletStyles = {
  root: {
    position: 'relative',
    display:'flex',
    height:'100%',
  },
  scrollPane: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top:0,
    left:0,
    right:0,
    bottom:0,
    zIndex:0,
    display:'none',
  },
  viewer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
}

export default withStyles(canvasLeafletStyles)(class CanvasLeaflet extends React.Component {
  static defaultProps = {
    onCanvasNext(delta) {},
  }

  handleOnWheel = createScrollHandler(delta => this.props.onCanvasNext(delta))

  render() {
    const {className, classes, canvas} = this.props
    const url = canvas ? canvas.image : null
    if (!url) return <div />
    return <div className={classnames(classes.root, className)}>
      <IIIFViewer url={`${url}/info.json`} className={classes.viewer} onWheel={this.handleOnWheel}/>
      <div className={classes.scrollPane} onWheel={this.handleOnWheel}/>
    </div>
  }
})
