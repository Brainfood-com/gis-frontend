import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'

const styles = {
}

export default withStyles(styles)(class GoogleStreetView extends React.Component {
  static propTypes = {
    location: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    }).isRequired,
    heading: PropTypes.number,
  }

  static defaultProps = {
    children: 'Google Street View',
  }

  render() {
    const {children, location, heading, ...props} = this.props
    if (!location) return <div/>
    return <Button {...props} target='googlestreetview' href={`https://maps.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}&heading=${heading}`}>{children}</Button>
  }
})
