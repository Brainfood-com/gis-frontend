import React from 'react'

import {Marker} from 'react-leaflet'
import 'leaflet-rotatedmarker'

let counter = 0

export default class RotatableMarker  extends React.Component {
  state = {}

  static getDerivedStateFromProps(props, state) {
    const {rotationAngle} = props
    if (state.rotationAngle !== rotationAngle) {
      return {key: counter++, rotationAngle}
    } else {
      return {rotationAngle}
    }
  }

  render() {
    const {key} = this.state
    return <Marker {...this.props} key={key}/>
  }
}
