import React from 'react'

import { GeoJSON } from 'react-leaflet'

let counter = 0

export default class GISGeoJSON extends React.Component {
  static defaultProps = {
    data: [],
  }

  state = {}

  static getDerivedStateFromProps(props, state) {
    const {data} = props
    if (state.data !== data) {
      return {key: counter++, data}
    } else {
      return {data}
    }
  }

  render() {
    const {data, ...props} = this.props
    const {key} = this.state
    return <GeoJSON {...props} key={key} data={data}/>
  }
}
