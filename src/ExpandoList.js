import flow from 'lodash/flow'
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import AttachMoneyIcon from '@material-ui/icons/AttachMoney'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import ErrorIcon from '@material-ui/icons/Error'
import RoomIcon from '@material-ui/icons/Room'
import PhotoIcon from '@material-ui/icons/Photo'
import CloseIcon from '@material-ui/icons/Close'
import HelpIcon from '@material-ui/icons/Help'
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
import {picked as userPicked} from './User'

const styles = theme => ({
  root: {},
  heading: {},
  secondaryHeading: {},
  nested: {
    paddingLeft: theme.spacing.unit * 1,
  },
  menuItemRoot: {},
  menuItemSelected: {},
  excludedText: {
    textDecoration: 'line-through',
  },
  excludedIcon: {
  },
  errorText: {
    color: '#ffaaaa',
  },
  errorIcon: {
    color: '#ff5555',
  },
  placedText: {
    color: '#aaaaff',
  },
  placedIcon: {
    color: '#5555ff',
  },
  validatedText: {
    color: '#aaffaa',
  },
  validatedIcon: {
    color: '#00ff00',
  },
  claimedText: {
    color: '#ffffaa',
  },
  claimedIcon: {
    color: '#ffff00',
  },
  clientApprovedMenu: {
    backgroundColor: 'rgba(0, 255, 0, 0.5)',
    '&$menuItemRoot:hover': {
      backgroundColor: 'rgba(0, 255, 0, 0.2)',
      '& $clientApprovedText': {
        color: '#000000',
      },
      '& $clientApprovedIcon': {
        color: '#000000',
      },
    },
    '&$menuItemSelected': {
      backgroundColor: 'rgba(0, 255, 0, 0.2)',
    }
  },
  clientApprovedText: {
    color: '#00ff00',
  },
  clientApprovedIcon: {
    color: '#00ff00',
  },
})

export default flow(withStyles(styles), userPicked('permissions'))(class ExpandoList extends React.Component {
  static defaultProps = {
    onItemPicked(id) {},
    items: immutableEmptyMap,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  handleOnMenuOpen = (ev) => {
    ev.preventDefault()
    this.setState({anchorEl: ev.currentTarget})
  }

  handleOnMenuClose = (ev) => {
    ev.preventDefault()
    const {currentTarget: {value}} = ev
    this.setState({anchorEl: null})
    if (value !== undefined) {
      this.props.onItemPicked(value)
    }
  }

  handleOnClose = (ev) => {
    ev.preventDefault()
    this.setState({anchorEl: null})
    this.props.onItemPicked(null)
  }

	handleOnClick = (ev, id) => {
    ev.preventDefault()
    const {expanded} = this.state
    this.setState({expanded: expanded === id ? false : id})
  }

  render() {
		const {className, classes, selectedItem, items, Icon, IconLabel, permissions} = this.props
    const {anchorEl} = this.state
    const isOpen = !!selectedItem
    const isBrainfoodAdmin = permissions.has('brainfood_admin')
    return <List dense={true}>
      <ListItem button disableGutters className={classnames(classes.root, className)} onClick={this.handleOnMenuOpen}>
        {Icon ? <Avatar>{Icon}</Avatar> : null}
        <ListItemText primary={`Select a ${IconLabel}`}/>
        <ListItemSecondaryAction disabled={!isOpen}>
          <Button disabled={!isOpen} color='secondary' onClick={this.handleOnClose}>
            <CloseIcon/>
          </Button>
        </ListItemSecondaryAction>
      </ListItem>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={this.handleOnMenuClose}>
        {items.toIndexedSeq().map((item, index) => {
          const id = item.get('id')
          const label = item.get('label')
          const type = item.get('type')
          const extra = item.get('_extra', immutableEmptyList)
          const secondaryItems = [`${id}.${index}`]
          const tags = item.get('tags', immutableEmptyList)
          const tagFlags = {}
          tags.forEach(tag => {
            tagFlags[tag.toLowerCase()] = true
          })
          const bftagFlags = {}
          const bftags = item.getIn(['values', 'bftags'], immutableEmptyList)
          bftags.forEach(tag => {
            bftagFlags[tag.toLowerCase()] = true
          })
          let icon
          const secondaryIcon = []
          const statusClasses = {}
          if (tagFlags['excluded']) {
            statusClasses.excluded = true
          }
          if (bftagFlags['paid']) {
            secondaryIcon.push(<AttachMoneyIcon key='paid' titleAccess='Paid'/>)
          }
          if (bftagFlags['training example']) {
            secondaryIcon.push(<HelpIcon key='training example' titleAccess='Training Example'/>)
          }
          if (tagFlags['needs review']) {
            icon = <ErrorIcon titleAccess='Needs Review'/>
            statusClasses.error = true
          } else if (tagFlags['routing glitch']) {
            icon = <ErrorIcon titleAccess='Routing Glitch'/>
            statusClasses.error = true
          } else if (tagFlags['client approved']) {
            icon = <CheckCircleIcon titleAccess='Client Approved'/>
            statusClasses.clientApproved = true
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
          const menuClasses = {}, iconClasses = {}, textClasses = {}
          Object.keys(statusClasses).forEach(statusClass => {
            menuClasses[classes[`${statusClass}Menu`]] = true
            iconClasses[classes[`${statusClass}Icon`]] = true
            textClasses[classes[`${statusClass}Text`]] = true
          })
          extra.forEach((item, index) => {
            const name = item.get('name')
            const value = item.get('value')
            secondaryItems.push(`${name}=${value}`)
          })
          return <MenuItem key={id} classes={{root: classes.menuItemRoot, selected: classes.menuItemSelected}} className={classnames(menuClasses)} selected={selectedItem === item} value={id} onClick={this.handleOnMenuClose}>
            <ListItemIcon className={classnames(iconClasses)}>{icon}</ListItemIcon>
            <ListItemText classes={{primary: classnames(textClasses)}} primary={label} secondary={secondaryItems.join(' ')}/>
            {isBrainfoodAdmin && secondaryIcon.length > 0 && <ListItemIcon><React.Fragment>{secondaryIcon}</React.Fragment></ListItemIcon>}
          </MenuItem>
        })}
      </Menu>
    </List>
  }
})
