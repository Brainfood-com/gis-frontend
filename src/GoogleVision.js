import flow from 'lodash-es/flow'
import React from 'react'
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
  state = {
    open: false,
  }

  static getDerivedStateFromProps(props, state) {
    const {googleVision} = props
    return {
      googleVision: googleVision && googleVision.toJS ? googleVision.toJS() : googleVision,
    }
  }

  handleOnClick = event => {
    const {open} = this.state
    this.setState({open: !open})
  }

  render() {
    const {className, classes} = this.props
    const {open, googleVision} = this.state
    if (!googleVision) {
      return <div />
    }
    const {grey, hsv, rgb, labels, ocr} = googleVision
    const wantedClasses = {
      [classes.root]: true,
    }
    const {ain, effective_year_built, property_location, ...rest} = googleVision
    return <List className={classnames(wantedClasses, className)} dense={true}>
      <ListItem disableGutters>
        <ListItemText primary='Google Vision'/>
      </ListItem>
      <ListItem disableGutters>
        <ListItemText primary='Labels'/>
        <div className={classes.row}>
          {labels.map((label, index) => <Chip key={label} label={label}/>)}
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

