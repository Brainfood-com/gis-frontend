import React from 'react'

import { withStyles } from '@material-ui/core/styles'

import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'

const styles = {
  root: {
    maxWidth: 200,
    display: 'flex',
    flexDirection: 'column',
    '& > *': {
      flex: 0,
      flexBasis: 200,
    },
    height: '100%',
  },
  fillRemaining: {
    flexBasis: 'auto',
  },
}
class GISPicView extends React.Component {
  render() {
    const {children, classes} = this.props
    return <div className={classes.root}>
      <Paper>
        <Typography variant='title'>Street View</Typography>
      </Paper>
      <Paper>
        <Typography variant='title'>Ruscha</Typography>
      </Paper>
      <Paper className={classes.fillRemaining}>remaining</Paper>
    </div>
  }
}

export default withStyles(styles)(GISPicView)
