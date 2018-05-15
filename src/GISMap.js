import React from 'react'

import { withStyles } from 'material-ui/styles'

import { GeoJSON, Map, TileLayer, WMSTileLayer, LayersControl, MapControl, Circle, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

import GISGeoJSON from './GISGeoJSON'
import LeafletPolylineDecorator from './LeafletPolylineDecorator'
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

function swap(a) {
  return [a[1], a[0]]
}

class GeoServerUtil {
  constructor(props) {
    this.servers = props.servers
  }

  loginBuilder(serverName) {
    const serverDef = this.servers[serverName]
    if (serverDef.loggedIn) {
      return serverDef.loggedIn
    }
    const form = new URLSearchParams()
    form.set('username', serverDef.username)
    form.set('password', serverDef.password)
    return serverDef.loggedIn = fetch(`${serverDef.url}/j_spring_security_check`, {credentials: 'include', method: 'POST', mode: 'no-cors', body: form})
  }

  async fetch({server, typeName, workspace}) {
    const parameters = {
      ...defaultGeoJSONParamters,
      typeName,
      maxFeatures: 15000,
    }
    const url = new URL(`${this.servers[server].url}/${workspace}/ows`)
    url.search = new URLSearchParams(parameters)

    const data = await this.loginBuilder(server).then(() => fetch(url, {credentials: 'include', datatype: 'json'}).then(data => data.json()))

    let totalLength = 0
    const allSegments = []
    const allPoints = []
    const processSegment = (segmentDef) => {
      const segmentPoints = []
      let a = swap(segmentDef[0])
      segmentPoints.push(a)
      for (let i = 1; i < segmentDef.length; i++) {
        const b = swap(segmentDef[i])
        segmentPoints.push(b)
        const lineLength = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
        const segment = [a, b]
        segment.totalLength = totalLength
        segment.lineLength = lineLength
        allSegments.push(segment)
        totalLength += lineLength
        a = b
      }
      allPoints.push(segmentPoints)
    }
    for (const feature of data.features) {
      switch (feature.geometry.type) {
        case 'MultiLineString':
          for (const piece of feature.geometry.coordinates) {
            processSegment(piece)
          }
          break
        case 'LineString':
          processSegment(feature.geometry.coordinates)
          break
        case 'MultiPolygon':
        case 'Polygon':
          break
        default:
          throw new Error('foo')
      }
    }
    return {data, allSegments, allPoints, totalLength}
  }
}


const geoserver = window.location.href.replace(/(https?:\/\/)(.*\.)?gis(\.[^:\/]+(:\d+)?).*/, '$1geoserver.gis$3/geoserver')
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
  {name: 'OSM', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', type: 'tile'},
]

const overlayLayers = [
  {name: 'US States', workspace: 'gis', layers: 'gis:tl_2017_us_state', type: 'wms'},
  {name: 'Las Vegas Water', workspace: 'gis', layers: 'gis:tl_2017_06037_areawater', type: 'wms'},
  {name: 'Las Vegas Places', workspace: 'gis', layers: 'gis:tl_2017_06_place', type: 'wms'},

  {name: 'lariac_buildings', workspace: 'gis', layers: 'gis:lariac_buildings', type: 'wms'},
  {name: 'tiger-roads', workspace: 'gis', layers: 'gis:tl_2017_06037_roads', type: 'wms'},
  {name: 'sunset_buildings', workspace: 'gis', layers: 'gis:sunset_buildings', type: 'wms'},
  {name: 'tiger-roads-tms', workspace: 'gis', layers: 'gis:tl_2017_06037_roads', type: 'geotile'},
  {name: 'lariac_buildings-tms', workspace: 'gis', layers: 'gis:lariac_buildings', type: 'geotile'},
  {name: 'sunset_road-tms', workspace: 'gis', layers: 'gis:sunset_road', type: 'geotile'},
  {name: 'sunset_buildings-tms', workspace: 'gis', layers: 'gis:sunset_buildings', type: 'geotile'},
  {name: 'sunset_buildings-json', workspace: 'gis', layers: 'gis:sunset_buildings', type: 'geojson', checked: true},
  {name: 'sunset_road-json', workspace: 'gis', layers: 'gis:sunset_road', type: 'geojson'},
  {name: 'sunset_road_reduced-json', workspace: 'gis', layers: 'gis:sunset_road_reduced', type: 'geojson', checked: false},
  {name: 'sunset_road_problems-json', workspace: 'gis', layers: 'gis:sunset_road_problems', type: 'geojson', checked: false},
//  {name: 'sunset_road_debug-json', workspace: 'gis', layers: 'gis:sunset_road_debug', type: 'geojson', checked: false, positioned: false},
//  {name: 'sunset_road_merged-json', workspace: 'gis', layers: 'gis:sunset_road_merged', type: 'geojson', future: roadLine, checked: true,},
//  {name: 'sunset_taxdata_2017-json', workspace: 'gis', layers: 'gis:sunset_taxdata_2017', type: 'geojson'},
//  {name: 'sunset_taxdata_2017_buildings-json', workspace: 'gis', layers: 'gis:sunset_taxdata_2017_buildings', type: 'geojson'},
]

const colorFetcher = buildListFetcher(colorList)
const styleFeature = feature => {
  return {color: colorFetcher()}
}

function renderLayer(Control, layerDefOrig, onSegment) {
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
        url={`${geoserverUtil.servers[server].url}/gwc/service/tms/1.0.0/${layers}@EPSG:900913@png/{z}/{x}/{-y}.png`}
      />
      break
    case 'geojson':
      //layer = <DelayedGeoJSON server={server} typeName={layers} workspace={workspace} position={layerDef.positioned ? position : undefined}/>
      layer = <DelayedGeoJSON server={server} workspace={workspace} layers={layers} future={layerDef.future}/>
      break
    case 'wms':
      layer = <WMSTileLayer
        attribution='foo'
        layers={layers}
        transparent={true}
        opacity={0.5}
        format='image/png'
        url={`${geoserverUtil.servers[server].url}/ows?tile=true`}
      />
      break
    default:
      return
  }
  return <Control key={name} name={name} checked={checked}>{layer}</Control>
}
const defaultGeoJSONParamters = {
  service: 'WFS',
  version: '1.0.0',
  request: 'getFeature',
  //typeName: 'cite:bc_well_data_wgs',
  //maxFeatures: 3000,
  outputFormat: 'application/json',
}

function loginBuilder(serverName) {
  const serverDef = servers[serverName]
  if (serverDef.loggedIn) {
    return serverDef.loggedIn
  }
  const form = new URLSearchParams()
  form.set('username', serverDef.username)
  form.set('password', serverDef.password)
  return serverDef.loggedIn = fetch(`${serverDef.url}/j_spring_security_check`, {credentials: 'include', method: 'POST', mode: 'no-cors', body: form})
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

class GISMap extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      zoom: 11,
      ...this.processProps(props, {zoom: 11}),
    }
    this.roadLine = geoserverUtil.fetch({server: 'app', workspace: 'gis', typeName: 'gis:sunset_road_merged'})
    this.roadLine.then(({data, allSegments, allPoints, totalLength}) => {
      this.setState({data, allSegments, allPoints, totalLength})
    })
  }

  buildPatterns(position, zoom) {
    let size;
    if (zoom < 14) {
      size = 15
    } else {
      size = Math.pow(2, (zoom - 14)) * 30
    }
    console.log('buildPatterns', {position, zoom, size})
    return [
      /*
      {
        offset: props.position !== undefined ? `${props.position}%` : undefined,
        repeat: 0,
        symbol: LeafletPolylineDecorator.Symbol.marker({
          rotate: true,
          markerOptions: {
            icon: L.icon({
              iconUrl: X32_png,
              iconAnchor: [16, 16],
              shadowUrl: null,
              shadowRetinaUrl: null,
            }),
          },
          //pixelSize: 15,
          //polygon: false,
          //pathOptions: {stroke: true},
        }),
      },
      */
      {
        offset: position !== undefined ? `${position}%` : undefined,
        repeat: 0,
        symbol: LeafletPolylineDecorator.Symbol.arrowHead({
          pixelSize: size,
          polygon: true,
          pathOptions: {
            stroke: true,
          },
        }),
      },
    ]

  }

  processProps(props, prevState) {
    const {position} = props
    const {zoom} = prevState
    const nextState = {}
    if (prevState.position !== position) {
      nextState.patterns = this.buildPatterns(position, zoom)
    }
    return nextState
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.processProps(nextProps, this.state))
  }

  onViewportChange = ({center, zoom}) => {
    console.log('zoom', zoom)
    this.setState({zoom, patterns: this.buildPatterns(this.props.position, zoom)})
    // 14 = 26
    // 15 = 35
    // 16 = 50
  }

  render() {
    const {classes, position} = this.props
    const {data, allPoints, patterns} = this.state

		const dallas_center = [32.781132, -96.797271]
		const la_center = [34.0522, -118.2437]

    return <div className={classes.root}>
      <Map className={classes.map} center={la_center} zoom={11} onViewportChange={this.onViewportChange}>
			 	<LayersControl>
          {baseLayers.map(layerDef => renderLayer(LayersControl.BaseLayer, layerDef))}
          {overlayLayers.map(layerDef => renderLayer(LayersControl.Overlay, layerDef, this.onSegment))}
          <LayersControl.Overlay name='sunset-road' checked={true}>
            <GISGeoJSON data={data}/>
          </LayersControl.Overlay>
			 	</LayersControl>
        <LeafletPolylineDecorator latlngs={allPoints} patterns={patterns}/>
      </Map>
    </div>
  }
}

export default withStyles(styles)(GISMap)
