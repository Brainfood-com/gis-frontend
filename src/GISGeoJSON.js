import React from 'react'

import { GeoJSON } from 'react-leaflet'

export default class GISGeoJSON extends GeoJSON {
  static defaultProps = {
    data: [],
  }

	constructor(props) {
    super(props)
    this.state = {
      data: props.data,
    }
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps)
    const {data} = nextProps
    if (data && data !== this.state.data) {
      this.setState({data})
      this.leafletElement.clearLayers()
      this.leafletElement.addData(data)
    }
  }
}
