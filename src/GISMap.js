import isEqual from 'lodash-es/isEqual'
import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import { withStyles } from '@material-ui/core/styles'

import { MapLayer, Popup, GeoJSON, Map, TileLayer, WMSTileLayer, LayersControl, MapControl, Circle, CircleMarker, ScaleControl, Polygon, Polyline, PropTypes as LeafletPropTypes } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import ReIssueApiGeoServerLogin from './api/ReIssueApiGeoServerLogin'
import GeoServerUtil from './api/GeoServerUtil'
import DraggableCanvasPosition from './leaflet/DraggableCanvasPosition'
import RangePoints from './leaflet/RangePoints'

import leafletMarkerIcon from 'leaflet/dist/images/marker-icon.png'
import leafletMarkerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import leafletMarkerIconShadow from 'leaflet/dist/images/marker-shadow.png'
import CameraPosition from './leaflet/CameraPosition'
import CanvasDropTarget from './leaflet/CanvasDropTarget'
import { MapAddresses, MapBuildings } from './GISSearch'

L.Marker.prototype.options.icon = L.icon({
  ...L.Icon.Default.prototype.options,
  iconUrl: leafletMarkerIcon,
  iconRetinaUrl: leafletMarkerIconRetina,
  shadowUrl: leafletMarkerIconShadow,
})

import {makeUrl} from './api'
import GISGeoJSON from './GISGeoJSON'
import X32_png from './images/X-32.png'

const colorList = [
  '#FF3333', '#FF6666', '#FF9999', '#FFCCCC',
  '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC',
  '#33FF33', '#66FF66', '#99FF99', '#CCFFCC',
  '#33FFFF', '#66FFFF', '#99FFFF', '#CCFFFF',
  '#3333FF', '#6666FF', '#9999FF', '#CCCCFF',
  '#FF33FF', '#FF66FF', '#FF99FF', '#FFCCFF',
             '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
]

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function buildListFetcher(list) {
  const shuffled = shuffle([].concat(list))
  let i = 0
  return () => {
    const result = shuffled[i++]
    if (i === shuffled.length) {
      i = 0
    }
    return result
  }
}

const geoserver = makeUrl('geoserver', 'geoserver')
//window.location.href.replace(/(https?:\/\/)(.*\.)?gis(?:-app)?(\.[^:\/]+(:\d+)?).*/, '$1geoserver.gis$3/geoserver')
const geoserverUtil = new GeoServerUtil({
  servers: {
    'app': {
      url: geoserver,
      username: 'admin',
      password: 'geoserver',
    },
  },
})
const baseLayers = [
  {name: 'OSM', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', type: 'tile', checked: false},
  {name: 'Wikimedia', url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png', type: 'tile', checked: true},
]

const overlayLayers = [
  {name: 'US States', workspace: 'gis', layers: 'gis:tl_2017_us_state', type: 'wms'},
  {name: 'Los Angles Water', workspace: 'gis', layers: 'gis:tl_2017_06037_areawater', type: 'wms'},
  {name: 'Los Angles Places', workspace: 'gis', layers: 'gis:tl_2017_06_place', type: 'wms'},

  {name: 'lariac_buildings', workspace: 'gis', layers: 'gis:lariac_buildings', type: 'wms'},
  {name: 'tiger-edges', workspace: 'gis', layers: 'gis:tl_2017_06037_edges', type: 'wms'},
  {name: 'tiger-roads', workspace: 'gis', layers: 'gis:tl_2017_06037_roads', type: 'wms'},
  {name: 'tiger-roads-tms', workspace: 'gis', layers: 'gis:tl_2017_06037_roads', type: 'geotile'},
  {name: 'lariac_buildings-tms', workspace: 'gis', layers: 'gis:lariac_buildings', type: 'geotile'},
]

class DelayLeafletLogin extends React.Component {
  constructor(props) {
    super(props)
    this.state = {init: false}
  }

  componentWillMount() {
    const {server} = this.props
    server.init().then(() => {
      this.setState({init: true})
    })
  }

  componentWillReceiveProps(nextProps) {
    const {server} = nextProps
    if (server !== this.props.server) {
      this.setState({init: false})
      server.init().then(() => {
        this.setState({init: true})
      })
    }
  }

  render() {
    const {children} = this.props
    const {init} = this.state
    if (init) {
      return children
    } else {
      return <div/>
    }
  }
}

const colorFetcher = buildListFetcher(colorList)
export const styleFeature = feature => {
  return {color: colorFetcher()}
}

function renderLayer(Control, layerDefOrig) {
  const {
    layers,
    name,
    server: server = 'app',
    type,
    workspace,
    url: url,
    checked,
    ...layerDef
  } = layerDefOrig
  let layer
  switch (type) {
    case 'tile':
      layer = <TileLayer
        attribution='foo'
        url={url}
      />
      break
    case 'geotile':
      layer = <TileLayer
        attribution='foo'
        url={`${geoserverUtil.servers[server].serverDef.url}/gwc/service/tms/1.0.0/${layers}@EPSG:900913@png/{z}/{x}/{-y}.png`}
      />
      break
    case 'wms':
      layer = <DelayLeafletLogin server={geoserverUtil.servers[server]}><WMSTileLayer
        attribution='foo'
        layers={layers}
        transparent={true}
        opacity={0.5}
        format='image/png'
        url={`${geoserverUtil.servers[server].serverDef.url}/ows`}
      /></DelayLeafletLogin>
      break
    default:
      return
  }
  return <Control key={name} name={name} checked={checked}>{layer}</Control>
}

const styles = {
  root: {
    position: 'relative',
  },
	map: {
    position: 'absolute',
    width: '100%',
    height: '100%',
	},
}

class WithinAccuracy extends React.Component {

  render() {
    const {withinMeters, position, rotation} = this.props

    return <Polyline />
  }
}
//261741105 220044581

class GISMap extends React.Component {
  static defaultProps = {
    onViewportChange(opts) {},
  }

  state = {
    mounted: false,
  }

  onEachCanvasListFeature = (feature, layer) => {
    const {
      properties: {
        thumbnail,
        image,
        ...properties
      },
    } = feature
    const lines = [].concat(Object.keys(properties).map(key => `${key}: ${properties[key]}`))
    lines.push(`<img width="400" height="225" src=${thumbnail}/full/full/0/default.jpg/>`)
    layer.bindPopup(lines.join('<br />'))
    //layer.setStyle(styleFeature(feature))
  }

  handleOnViewportChange = ({center, zoom}) => {
    this.props.onViewportChange({center, zoom})
  }

  handleOnLoading = () => {
    console.log('onLoading', arguments)
  }

  handleOnLoad = () => {
    console.log('onLoad', arguments)
  }

  componentDidMount() {
    this.setState({mounted: true})
  }


  render() {
    const {className, classes, center, zoom} = this.props
    const {mounted} = this.state

    if (!mounted) {
      return <div className={classnames(classes.root, className)}/>
    }

        //<CanvasDragResult target={dragLatLng}/>
    return <div className={classnames(classes.root, className)}>
      <Map className={classes.map} center={center} zoom={zoom} onViewportChange={this.handleOnViewportChange} onLoading={this.handleOnLoading} onLoad={this.handleOnLoad}>
        <CanvasDropTarget/>
        <ScaleControl/>
			 	<LayersControl>
          {baseLayers.map(layerDef => renderLayer(LayersControl.BaseLayer, layerDef))}
          {overlayLayers.map(layerDef => renderLayer(LayersControl.Overlay, layerDef))}
          <LayersControl.Overlay name='iiif-canvaslist' checked={true}>
            <RangePoints zoom={zoom}/>
          </LayersControl.Overlay>
          <LayersControl.Overlay name='search-addresses' checked={true}>
            <MapAddresses/>
          </LayersControl.Overlay>
          <LayersControl.Overlay name='search-buildings' checked={true}>
            <MapBuildings/>
          </LayersControl.Overlay>
			 	</LayersControl>
        <CameraPosition zoom={zoom}/>
      </Map>
    </div>
  }
}

export default withStyles(styles)(GISMap)
