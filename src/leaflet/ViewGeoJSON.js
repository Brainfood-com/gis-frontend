import { GeoJSON } from 'react-leaflet'
import * as apiRedux from '../api/redux'
import connectHelper from '../connectHelper'
import {styleFeature} from '../GISMap'

export default connectHelper({mapStateToProps: apiRedux.mapStateToProps})(class ViewGeoJSON extends GeoJSON {
  static defaultProps = {
    data: [],
    onEachFeature: (feature, layer) => {
      const {properties} = feature
      layer.bindPopup(Object.keys(properties).map(key => `${key}: ${properties[key]}`).join('<br />'))
      layer.setStyle(styleFeature(feature))
    },
  }

  constructor(props) {
    super(props)
    this.state = {data: null}
  }

  componentWillMount() {
    super.componentWillMount()
    this.processProps(this.props)
  }

  processProps(props) {
    const {viewFeatures} = props
    if (this.props.viewFeatures !== viewFeatures) {
      const {data} = viewFeatures
      this.setState({data})
      if (this.leafletElement) {
        this.leafletElement.clearLayers()
        this.leafletElement.addData(data)
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps)
    this.processProps(nextProps)
  }
})
