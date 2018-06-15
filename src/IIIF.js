import React from 'react'
import Typography from '@material-ui/core/Typography'

import {ManifestForm, ManifestPick} from './iiif/Manifest'
import {CollectionForm, CollectionPick} from './iiif/Collection'
import {RangeForm, RangePick} from './iiif/Range'
import {CanvasForm} from './iiif/Canvas'

export class IIIFTree extends React.Component {
  render() {
		const {className, collections} = this.props
    return <div className={className}>
      <Typography variant='title'>Collection</Typography>
      <CollectionPick/>
      <CollectionForm/>
      <Typography variant='title'>Manifest</Typography>
      <ManifestPick/>
      <ManifestForm/>
      <Typography variant='title'>Range</Typography>
      <RangePick/>
      <RangeForm/>
      <Typography variant='title'>Canvas</Typography>
      <CanvasForm/>
    </div>
  }
}
