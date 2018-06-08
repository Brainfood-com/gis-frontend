import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import Button from '@material-ui/core/Button'
import CloseIcon from '@material-ui/icons/Close'
import Collapse from '@material-ui/core/Collapse'

import ListItem from '@material-ui/core/ListItem'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'

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
    onItemPicked(index) {},
  }

  constructor(props) {
    super(props)
    const {items, itemId} = props
    const value = !!itemId && items ? items.findIndex(item => item.id === itemId) : null
    this.state = {value, items}
  }

  componentWillReceiveProps(nextProps) {
    const {items, itemId} = nextProps
    if (items !== this.state.items) {
      this.setState({value: items.findIndex(item => item.id === itemId), items})
    } else if (!!items && !!itemId) {
      this.setState({value: this.state.items.findIndex(item => item.id === itemId)})
    }
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
      this.setState({value})
      this.props.onItemPicked(value)
    }
  }

  handleOnClose = (ev) => {
    ev.preventDefault()
    this.setState({anchorEl: null, value: null})
    this.props.onItemPicked(null)
  }


	handleOnClick = (ev, id) => {
    ev.preventDefault()
    const {expanded} = this.state
    this.setState({expanded: expanded === id ? false : id})
  }

  render() {
		const {className, classes, itemId, items = [], Icon, IconLabel, ItemDetail} = this.props
    const {anchorEl, value} = this.state
    const isOpen = value !== null
    const item = isOpen ? items[value] : null
    return <React.Fragment>
      <ListItem button disableGutters className={classnames(classes.root, className)} onClick={this.handleOnMenuOpen}>
        <Avatar>{Icon}</Avatar>
        <ListItemText primary={item ? item.label : IconLabel}/>
        <ListItemSecondaryAction disabled={!isOpen}>
          <Button disabled={!isOpen} onClick={this.handleOnClose}>
            <CloseIcon/>
          </Button>
        </ListItemSecondaryAction>
      </ListItem>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={this.handleOnMenuClose}>
        {items.map((item, index) => {
          const {id, label} = item
          return <MenuItem key={id} selected={index === value} value={index} onClick={this.handleOnMenuClose}>{label}[{id}.{index}]({item.type})</MenuItem>
        })}
      </Menu>
      <Collapse in={isOpen} unmountOnExit>
        {React.cloneElement(ItemDetail, {item})}
      </Collapse>
    </React.Fragment>
  }
})
