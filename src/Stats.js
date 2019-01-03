import flow from 'lodash-es/flow'
import React from 'react'

import { withStyles } from '@material-ui/core/styles'

import Badge from '@material-ui/core/Badge'
import Typography from '@material-ui/core/Typography'

import ErrorIcon from '@material-ui/icons/Error'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import RoomIcon from '@material-ui/icons/Room'
import PhotoIcon from '@material-ui/icons/Photo'

import {stats} from './iiif/stats'
/*
import AppBar from '@material-ui/core/AppBar'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import MenuIcon from '@material-ui/icons/Menu'
import Toolbar from '@material-ui/core/Toolbar'

import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CloseIcon from '@material-ui/icons/Close'
import Collapse from '@material-ui/core/Collapse'

import List from '@material-ui/core/List'
import TextField from '@material-ui/core/TextField'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import {immutableEmptyList, immutableEmptyMap} from './constants'
          if (tagFlags['needs review']) {
            icon = <ErrorIcon titleAccess='Needs Review'/>
            statusClasses.error = true
          } else if (tagFlags['routing glitch']) {
            icon = <ErrorIcon titleAccess='Routing Glitch'/>
            statusClasses.error = true
          } else if (tagFlags.validated) {
            icon = <CheckCircleIcon titleAccess='Validated'/>
            statusClasses.validated = true
          } else if (tagFlags.placed) {
            icon = <RoomIcon titleAccess='Placed'/>
            statusClasses.placed = true
          } else if (tagFlags.claimed) {
            icon = <PhotoIcon titleAccess='Claimed'/>
            statusClasses.claimed = true
          } else {
            icon = <CheckBoxOutlineBlankIcon/>
          }
*/

const styles = {
  errorText: {
    color: '#ffaaaa',
    display:'inline-block',
  },
  errorIcon: {
    color: '#ff5555',
  },
  placedText: {
    color: '#aaaaff',
    display:'inline-block',
  },
  placedIcon: {
    color: '#5555ff',
  },
  validatedText: {
    color: '#aaffaa',
    display:'inline-block',
  },
  validatedIcon: {
    color: '#00ff00',
  },
  claimedText: {
    color: '#ffffaa',
    display:'inline-block',
  },
  claimedIcon: {
    color: '#ffff00',
  },
}
class Stats extends React.Component {
  render() {
    const {classes, range} = this.props
    return <div className={classes.root}>
      <Badge color='secondary' badgeContent={range.get('claimed', '')}><PhotoIcon className={classes.claimedIcon} titleAccess='Claimed'/></Badge>
      <Badge color='secondary' badgeContent={range.get('placed', '')}><RoomIcon className={classes.placedIcon} titleAccess='Placed'/></Badge>
      <Badge color='secondary' badgeContent={range.get('validated', '')}><CheckCircleIcon className={classes.validatedIcon} titleAccess='Validated'/></Badge>
    </div>
  }
}

export default flow(withStyles(styles), stats('range'))(Stats)
