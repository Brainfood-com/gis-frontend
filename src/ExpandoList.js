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
import Immutable from 'immutable'

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
    items: Immutable.Map(),
  }

  constructor(props) {
    super(props)
    this.state = this.processProps({}, {}, props)
  }

  processProps(prevState, prevProps, nextProps) {
    const {items, itemId} = nextProps
    return {value: itemId}
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.processProps(this.state, this.props, nextProps))
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
		const {className, classes, itemId, items, Icon, IconLabel, ItemDetail} = this.props
    const {anchorEl, value} = this.state
    const isOpen = value !== null
    const item = isOpen ? items.get(value) : null
    //console.log('items', IconLabel, isOpen, value, item, items.toJSON())
    return <React.Fragment>
      <ListItem button disableGutters className={classnames(classes.root, className)} onClick={this.handleOnMenuOpen}>
        <Avatar>{Icon}</Avatar>
        <ListItemText primary={item ? item.get('label') : IconLabel}/>
        <ListItemSecondaryAction disabled={!isOpen}>
          <Button disabled={!isOpen} onClick={this.handleOnClose}>
            <CloseIcon/>
          </Button>
        </ListItemSecondaryAction>
      </ListItem>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={this.handleOnMenuClose}>
        {items.toList().map((item, index) => {
          const id = item.get('id')
          const label = item.get('label')
          const type = item.get('type')
          return <MenuItem key={id} selected={id === value} value={id} onClick={this.handleOnMenuClose}>{label}[{id}.{index}]({type})</MenuItem>
        })}
      </Menu>
      <Collapse in={isOpen} unmountOnExit>
        {React.cloneElement(ItemDetail, {item})}
      </Collapse>
    </React.Fragment>
  }
})
