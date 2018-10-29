import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import ErrorIcon from '@material-ui/icons/Error'
import RoomIcon from '@material-ui/icons/Room'
import PhotoIcon from '@material-ui/icons/Photo'
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
import {List as imList, Map} from 'immutable'

const styles = theme => ({
  root: {},
  heading: {},
  secondaryHeading: {},
  nested: {
    paddingLeft: theme.spacing.unit * 1,
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
})

const emptyList = new imList()

export default withStyles(styles)(class ExpandoList extends React.Component {
  static defaultProps = {
    onItemPicked(id) {},
    items: Map(),
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
		const {className, classes, selectedItem, items, Icon, IconLabel} = this.props
    const {anchorEl} = this.state
    const isOpen = !!selectedItem
    return <List dense={true}>
      <ListItem button disableGutters className={classnames(classes.root, className)} onClick={this.handleOnMenuOpen}>
        {Icon ? <Avatar>{Icon}</Avatar> : null}
        <ListItemText primary={`Select a ${IconLabel}`}/>
        <ListItemSecondaryAction disabled={!isOpen}>
          <Button disabled={!isOpen} onClick={this.handleOnClose}>
            <CloseIcon/>
          </Button>
        </ListItemSecondaryAction>
      </ListItem>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={this.handleOnMenuClose}>
        {items.map((item, index) => {
          const id = item.get('id')
          const label = item.get('label')
          const type = item.get('type')
          const extra = item.get('_extra', emptyList)
          const secondaryItems = [`${id}.${index}`, type]
          const tags = item.get('tags', emptyList)
          const tagFlags = {}
          tags.forEach(tag => {
            tagFlags[tag.toLowerCase()] = true
          })
          let icon
          const statusClasses = {}
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
          const iconClasses = {}, textClasses = {}
          Object.keys(statusClasses).forEach(statusClass => {
            iconClasses[classes[`${statusClass}Icon`]] = true
            textClasses[classes[`${statusClass}Text`]] = true
          })
          extra.forEach((item, index) => {
            const name = item.get('name')
            const value = item.get('value')
            secondaryItems.push(`${name}=${value}`)
          })
          return <MenuItem key={id} selected={selectedItem === item} value={id} onClick={this.handleOnMenuClose}>
            <ListItemIcon className={classnames(iconClasses)}>{icon}</ListItemIcon>
            <ListItemText classes={{primary: classnames(textClasses)}} primary={label} secondary={secondaryItems.join(' ')}/>
          </MenuItem>
        })}
      </Menu>
    </List>
  }
})
