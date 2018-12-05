import React from 'react'

import { withStyles } from '@material-ui/core/styles'

import AppBar from '@material-ui/core/AppBar'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'

import { Search } from './GISSearch'
import Stats from './Stats'
import {DebugUser} from './User'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      flex: 1,
      flexBasis: 'auto',
    },
    height: '100%',
  },
  appbar: {
    flex: 0,
    flexBasis: 64,
  },
  grow: {
    flexGrow: 1,
  },
	body: {
		flex: 2,
    flexBasis: '100%',
    position: 'relative',
  },
	bodyContent: {
    position: 'absolute',
    width: '100%',
    height: '100%',
	},
  footer: {
    display:'none',
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
}
class Page extends React.Component {
  render() {
    const {children, classes} = this.props
    return <div className={classes.root}>
      <AppBar position='static' color='default' className={classes.appbar}>
        <Toolbar>
					<IconButton className={classes.menuButton} color='inherit' aria-label='Menu'>
            <MenuIcon />
          </IconButton>
          <Typography variant='title'>GIS</Typography>
          <Search className={classes.grow}/>
          <Stats/>
        </Toolbar>
      </AppBar>
      <DebugUser />
      <div className={classes.body}>
        <div className={classes.bodyContent}>
          {children}
        </div>
      </div>
      <Toolbar className={classes.footer}>
        <IconButton className={classes.menuButton} color='inherit' aria-label='Menu'>
          <MenuIcon />
        </IconButton>
        <Typography variant='title'>footer</Typography>
      </Toolbar>
    </div>
  }
}

export default withStyles(styles)(Page)
