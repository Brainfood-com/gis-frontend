import flow from 'lodash-es/flow'
import React from 'react'
import ImmutablePropTypes from 'react-immutable-proptypes'
import PropTypes from 'prop-types'

import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import Collapse from '@material-ui/core/Collapse'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Chip from '@material-ui/core/Chip'
import Typography from '@material-ui/core/Typography'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

export const GoogleVisionShape = ImmutablePropTypes.mapContains({
  labels: ImmutablePropTypes.listOf(ImmutablePropTypes.mapContains({
    description: PropTypes.string.isRequired,
    score: PropTypes.number.isRequired,
  })),
  ocr: ImmutablePropTypes.listOf(PropTypes.string),
  grey: PropTypes.any,
  hsv: PropTypes.any,
  rgb: PropTypes.any,
})


const googleVisionStyles = {
  root: {
    border: '1px solid black',
    marginBottom: 10,
    '&:hover': {
      borderColor: 'white',
    },
  },
  detail: {
    borderTop: '1px solid white',
  },
  inlineList: {
    display: 'flex',
    flexDirection: 'row',
    padding: 0,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    '& *': {
      flexGrow: 0,
    },
  },
}

export default flow(withStyles(googleVisionStyles))(class GoogleVision extends React.Component {
  static propTypes = {
    googleVision: GoogleVisionShape,
  }

  state = {
    open: false,
  }

  handleOnClick = event => {
    const {open} = this.state
    this.setState({open: !open})
  }

  render() {
    const {className, classes, googleVision} = this.props
    const {open} = this.state
    if (!googleVision) {
      return <div />
    }
    const {grey, hsv, rgb, labels, ocr} = googleVision.toJS()
    const wantedClasses = {
      [classes.root]: true,
    }
    return <List className={classnames(wantedClasses, className)} dense={true}>
      <ListItem disableGutters>
        <ListItemText primary='Google Vision'/>
      </ListItem>
      <ListItem disableGutters>
        <ListItemText primary='Labels'/>
        <div className={classes.row}>
          {labels.map((label, index) => <Chip key={label.description} label={`${label.description}:${label.score}`}/>)}
        </div>
      </ListItem>
      <ListItem disableGutters>
        <ListItemText primary='OCR'/>
        <div className={classes.row}>
          {ocr.map((token, index) => <Chip key={token} label={token}/>)}
        </div>
      </ListItem>
    </List>
  }
})

