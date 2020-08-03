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
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

export const TaxdataShape = ImmutablePropTypes.mapContains({
  ain: PropTypes.number,
  effective_year_built: PropTypes.number,
  property_location: PropTypes.string,
})

const taxdataStyles = {
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
}

export default flow(withStyles(taxdataStyles))(class Taxdata extends React.Component {
  static propTypes = {
    taxdata: TaxdataShape,
  }

  state = {
    open: false,
  }

  handleOnClick = event => {
    const {open} = this.state
    this.setState({open: !open})
  }

  render() {
    const {className, classes, taxdata} = this.props
    const {open} = this.state
    if (!taxdata) {
      return <div />
    }
    const wantedClasses = {
      [classes.root]: true,
    }
    const {ain, effective_year_built, property_location, ...rest} = taxdata.toJS()
    return <List className={classnames(wantedClasses, className)} dense={true}>
      <ListItem disableGutters onClick={this.handleOnClick}>
        <ListItemText primary={`AIN: ${ain}`}/>
        <ListItemIcon>{open ? <ExpandMoreIcon/> : <ExpandLessIcon/>}</ListItemIcon>
      </ListItem>
      <ListItem disableGutters onClick={this.handleOnClick}>
        <ListItemText primary={`Effective Year Built: ${effective_year_built}`}/>
      </ListItem>
      <ListItem disableGutters onClick={this.handleOnClick}>
        <ListItemText primary={`Location: ${property_location}`}/>
      </ListItem>
      <Collapse in={open}>
        <List className={classes.detail} dense={true}>
          {Object.entries(rest).map(([key, value], index) => <ListItem key={key} disableGutters>
              <ListItemText primary={`${key}: ${value}`}/>
          </ListItem>)}
        </List>
      </Collapse>
    </List>
  }
})

