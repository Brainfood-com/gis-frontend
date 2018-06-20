import React from 'react'
import Typography from '@material-ui/core/Typography'

import {ManifestPanel} from './iiif/Manifest'
import {CollectionPanel} from './iiif/Collection'
import {RangePanel} from './iiif/Range'
import {CanvasForm} from './iiif/Canvas'

export class IIIFTree extends React.Component {
  render() {
		const {className, collections} = this.props
    return <div className={className}>
      <CollectionPanel/>
      <ManifestPanel/>
      <RangePanel/>
      <Typography variant='title'>Canvas</Typography>
      <CanvasForm/>
    </div>
  }
}
