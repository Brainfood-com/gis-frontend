import React from 'react'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'

export default class Taxdata extends React.Component {
  state = {}
  static getDerivedStateFromProps(props, state) {
    const {taxdata} = props
    return {
      taxdata: taxdata && taxdata.toJS ? taxdata.toJS() : taxdata,
    }
  }

  render() {
    const {taxdata} = this.state
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

