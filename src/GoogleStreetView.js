import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'

const styles = {
}

export default withStyles(styles)(class GoogleStreetView extends React.Component {
  static propTypes = {
    location: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    }).isRequired,
    heading: PropTypes.number,
    fov: PropTypes.number,
    size: PropTypes.string,
  }

  static defaultProps = {
    size: '400x225',
  }

  render() {
    const {location, heading, fov, size} = this.props
    if (!location) return <div/>
    const parameters = new URLSearchParams()
    Object.entries({
      size,
      source: 'outdoor',
      heading,
      fov,
      location: `${location.lat},${location.lng}`,
    }).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        parameters.set(key, value)
      }
    })
    return <a target='googlestreetview' href={`https://maps.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.lat},${location.lng}&heading=${heading}`}>Google Street View</a>

  }
})
