import React from 'react'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'

export default class Taxdata extends React.Component {
  render() {
    const {taxdata} = this.props
    if (!taxdata) {
      return <div />
    }
    return <List dense={true}>
      <ListItem disableGutters>
        <ListItemText primary={`AIN: ${taxdata.ain}`}/>
      </ListItem>
      <ListItem disableGutters>
        <ListItemText primary={`Effective Year Built: ${taxdata.effective_year_built}`}/>
      </ListItem>
      <ListItem disableGutters>
        <ListItemText primary={`Location: ${taxdata.property_location}`}/>
      </ListItem>
      <ListItem disableGutters>
        <ListItemText primary={`Land Value: ${taxdata.land_value}`}/>
      </ListItem>
    </List>
  }
}

