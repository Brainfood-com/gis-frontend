import flow from 'lodash-es/flow'
import React from 'react'

import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'

import {immutableEmptyMap} from './constants'
import { picked } from './iiif/Picked'
import {CanvasCardRO} from './iiif/Canvas'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
    //maxHeight: '100%',
  },
}
class GISResultsTaxdata extends React.Component {
  render() {
    const {taxdata} = this.props
    if (!taxdata) {
      return <div />
    }
    return <List dense={true}>
      <ListItem disableGutters>
        <ListItemText primary={`AIN: ${taxdata.get('ain')}`}/>
      </ListItem>
      <ListItem disableGutters>
        <ListItemText primary={`Effective Year Built: ${taxdata.get('effective_year_built')}`}/>
      </ListItem>
      <ListItem disableGutters>
        <ListItemText primary={`Location: ${taxdata.get('property_location')}`}/>
      </ListItem>
      <ListItem disableGutters>
        <ListItemText primary={`Land Value: ${taxdata.get('land_value')}`}/>
      </ListItem>
    </List>
  }
}

class GISResultsRange extends React.Component {
  render() {
    const {rangeId, range = immutableEmptyMap, canvases} = this.props
    return <div dense={true}>
      <Typography>rangeId:{rangeId}</Typography>
      <Typography>{range.get('label')}</Typography>
      {canvases.map(canvas => {
        const rangeId = canvas.get('range_id')
        const iiifId = canvas.get('iiif_id')
        return <div disableGutters>
          <CanvasCardRO key={`${rangeId}:${iiifId}`} canvas={canvas}/>
        </div>
      })}
    </div>
  }
}

class GISResultsPane extends React.Component {
  render() {
    const {children, classes, pickedBuilding = immutableEmptyMap, rangesById = {}, canvasesByRange = immutableEmptyMap} = this.props
    const taxdata = pickedBuilding.get('taxdata')

    console.log('GISResults/pickedBuilding', pickedBuilding.toJS())
    console.log('GISResults/canvasesByRange', canvasesByRange.toJS())
    console.log('GISResults/rangesById', rangesById)

    return <div className={classes.root}>
      <Typography>Results</Typography>
      <GISResultsTaxdata taxdata={taxdata}/>
      {canvasesByRange.map(canvases => {
        const rangeId = canvases.get(0).get('range_id')
        return <GISResultsRange key={rangeId} rangeId={rangeId} range={rangesById[rangeId]} canvases={canvases}/>
      })}
    </div>
  }
}

export default flow(picked(['pickedBuilding']), withStyles(styles))(GISResultsPane)
