import React from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import { GeoJSON } from 'react-leaflet'

export const GeoJSONShape = PropTypes.any

export default class GISGeoJSON extends React.Component {
  static propTypes = {
    data: GeoJSONShape
  }

  state = {
    key: 0,
  }

  static getDerivedStateFromProps(props, state) {
    const {data} = props
    if (data) {
      if (data !== state.data) {
        return {key: state.key + 1, data, dataJS: data.toJS()}
      } else {
        return {key: 0}
      }
    } else {
      return {data: undefined}
    }
  }

  /*
  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps)
    const {data} = nextProps
    if (data && data !== this.state.data) {
      this.setState({data})
      this.leafletElement.clearLayers()
      this.leafletElement.addData(data)
    }
  }
  */

  render() {
    const {data, ...props} = this.props
    const {key, dataJS} = this.state
    if (!data) return <div/>
    return <GeoJSON {...props} key={key} data={dataJS}/>
  }
}
