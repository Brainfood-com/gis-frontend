import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'

import IIIFViewer from 'react-leaflet-iiif-viewer'

const canvasLeafletStyles = {
  root: {
    position: 'relative',
  },
  viewer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
}

export default withStyles(canvasLeafletStyles)(class CanvasLeaflet extends React.Component {
  render() {
    const {className, classes, canvas} = this.props
    const url = canvas ? canvas.get('image') : null
    if (!url) return <div />
    return <div className={classnames(classes.root, className)}>
      <IIIFViewer url={`${url}/`} className={classes.viewer}/>
    </div>
  }
})
