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
import ViewGeoJSON from './leaflet/ViewGeoJSON'
import CanvasDropTarget from './leaflet/CanvasDropTarget'
import { MapAddresses, MapBuildings } from './GISSearch'

L.Marker.prototype.options.icon = L.icon({
  ...L.Icon.Default.prototype.options,
  iconUrl: leafletMarkerIcon,
  iconRetinalUrl: leafletMarkerIconRetina,
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
    case 'geojson':
      //layer = <DelayedGeoJSON server={server} typeName={layers} workspace={workspace} position={layerDef.positioned ? position : undefined}/>
      layer = <DelayedGeoJSON server={server} workspace={workspace} layers={layers} future={layerDef.future}/>
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

class DelayedGeoJSON extends GeoJSON {
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
    const {server, workspace, layers} = props
    if (this.state.data !== undefined && server === this.props.server && workspace === this.props.workspace && layers === this.props.layers) {
      if (props !== this.props) {
        return
      }
    }
    geoserverUtil.fetch({server, workspace, typeName: layers}).then(result => {
      if (server !== this.props.server || workspace !== this.props.workspace || layers != this.props.layers) {
        return
      }
      const {data} = result
      if (this.leafletElement) {
        this.leafletElement.clearLayers()
        this.leafletElement.addData(data)
      }
      this.setState({data})
    })
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps)
    this.processProps(nextProps)
  }
}

class IIIFGeoJSON extends GeoJSON {
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
    const {server, workspace, layers} = props
    if (this.state.data !== undefined && server === this.props.server && workspace === this.props.workspace && layers === this.props.layers) {
      if (props !== this.props) {
        return
      }
    }
    geoserverUtil.fetch({server, workspace, typeName: layers}).then(result => {
      if (server !== this.props.server || workspace !== this.props.workspace || layers != this.props.layers) {
        return
      }
      const {data} = result
      if (this.leafletElement) {
        this.leafletElement.clearLayers()
        this.leafletElement.addData(data)
      }
      this.setState({data})
    })
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(nextProps)
    this.processProps(nextProps)
  }
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

const dallas_center = [32.781132, -96.797271]
const la_center = [34.0522, -118.2437]

class GISMap extends React.Component {
  static defaultProps = {
    position: la_center,
  }

  state = {
    zoom: 11,
    center: la_center,
    mounted: false,
  }

  static getDerivedStateFromProps(state, props) {
    const {position} = props
    const nextState = {}
    if (state.position !== state.position) {
      nextState.position = nextState.center = center
    }
    return nextState
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
    this.setState({center, zoom})
    // 14 = 26
    // 15 = 35
    // 16 = 50
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
    const {className, classes} = this.props
    const {center, zoom, mounted} = this.state

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
          <LayersControl.Overlay name='view' checked={false}>
            <ViewGeoJSON/>
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
