import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import CloseIcon from '@material-ui/icons/Close'
import Collapse from '@material-ui/core/Collapse'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import {Map} from 'immutable'

const styles = theme => ({
  root: {},
  heading: {},
  secondaryHeading: {},
  nested: {
    paddingLeft: theme.spacing.unit * 1,
  },
})

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
          const extra = item.get('_extra')
          return <MenuItem key={id} selected={selectedItem === item} value={id} onClick={this.handleOnMenuClose}>{label}[{id}.{index}]({type}){extra}</MenuItem>
        })}
      </Menu>
    </List>
  }
})
