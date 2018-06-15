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
      <Typography variant='headline'>Collection</Typography>
      <CollectionPick/>
      <CollectionForm/>
      <Typography variant='headline'>Manifest</Typography>
      <ManifestPick/>
      <ManifestForm/>
      <Typography variant='headline'>Range</Typography>
      <RangePick/>
      <RangeForm/>
      <Typography variant='headline'>Canvas</Typography>
      <CanvasForm/>
    </div>
  }
}
