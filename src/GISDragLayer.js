import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import {DragLayer} from 'react-dnd'

import {CanvasCard} from './iiif/Canvas'

const typeToPreviewMap = {
  [CanvasCard.TYPE]: CanvasCard.PREVIEW,
}

const gisDragLayerStyles = {
  root: {
    position: 'fixed',
    cursor: 'none',
    pointerEvents: 'none',
    zIndex: 1000,
    top: 0,
    left: 0,
    width:'100%',
    height:'100%',
    display: 'block',
    '&$isDragging': {
      display: 'block',
    },
  },
  item: {
    position: 'absolute',
  },
  container: {
    cursor: 'none',
  },

  isDragging: {},
}

export default DragLayer(monitor => {
  return {
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialClientOffset: monitor.getInitialClientOffset(),
    initialSourceClientOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    offset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }
})(withStyles(gisDragLayerStyles)(class GISDragLayer extends React.Component {
  render() {
    const {
      className,
      classes,
      item,
      itemType,
      isDragging,
      initialClientOffset,
      initialSourceClientOffset,
      currentOffset,
      initialOffset,
    } = this.props
    const wantedClasses = {
      [classes.root]: true,
      [classes.isDragging]: isDragging,
    }

    const offset = {x: 0, y: 0}
    if (currentOffset) {
      offset.x = currentOffset.x - initialSourceClientOffset.x + initialClientOffset.x
      offset.y = currentOffset.y - initialSourceClientOffset.y + initialClientOffset.y
    }
    const PreviewClass = typeToPreviewMap[itemType]
    const childItem = PreviewClass && currentOffset ? <PreviewClass {...item}/> : <div />
    return <div className={classnames(wantedClasses, className)}>
      <div className={classes.item} style={{left: offset.x, top: offset.y}}>
        <div className={classes.container}>
          { childItem }
        </div>
      </div>
    </div>
  }
}))
