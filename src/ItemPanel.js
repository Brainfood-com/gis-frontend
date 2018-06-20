import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

// TODO: Use the theme size instead of hard-coded 4 and 8
const styles = {
  expanded: {
    margin: [4, 0],
  },
  summary: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  details: {
    flexDirection: 'column',
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
  },
}

export default withStyles(styles)(class ItemPanel extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    pick: PropTypes.element.isRequired,
    form: PropTypes.element.isRequired,
  }

  render() {
    const {className, classes, title, pick, form, expanded} = this.props

    return <ExpansionPanel className={className} classes={{expanded: classes.expanded}} defaultExpanded={true}>
      <ExpansionPanelSummary className={classes.summary} expandIcon={<ExpandMoreIcon />}>
        <Typography variant='title'>{title}</Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails className={classes.details}>
        {React.cloneElement(pick)}
        {React.cloneElement(form)}
      </ExpansionPanelDetails>
    </ExpansionPanel>
  }
})
