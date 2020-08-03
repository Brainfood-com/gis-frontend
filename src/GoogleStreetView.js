import React from 'react'
import ImmutablePropTypes from 'react-immutable-proptypes'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'

const styles = {
}

export default withStyles(styles)(class GoogleStreetView extends React.Component {
  static propTypes = {
    location: ImmutablePropTypes.mapContains({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    }).isRequired,
    heading: PropTypes.number,
  }

  static defaultProps = {
    children: 'Google Street View',
    Component: Button,
  }

  render() {
    const {Component, children, location, heading, ...props} = this.props
    if (!location) return <div/>
    const lat = location.get('lat')
    const lng = location.get('lng')
    return <Component {...props} target='googlestreetview' href={`https://maps.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=${heading}`}>{children}</Component>
  }
})
