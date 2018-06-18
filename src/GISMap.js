import React from 'react'
import PropTypes from 'prop-types'

import { withStyles } from '@material-ui/core/styles'

import { MapLayer, Popup, FeatureGroup, GeoJSON, Map, TileLayer, WMSTileLayer, LayersControl, MapControl, Circle, CircleMarker, ScaleControl, Polygon, Polyline, PropTypes as LeafletPropTypes } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import 'leaflet-geometryutil'
import RotableMarker from './RotatableMarker'
import {picked} from './iiif/Picked'

import leafletMarkerIcon from 'leaflet/dist/images/marker-icon.png'
import leafletMarkerIconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import leafletMarkerIconShadow from 'leaflet/dist/images/marker-shadow.png'
import CameraPosition from './leaflet/CameraPosition'

L.Marker.prototype.options.icon = L.icon({
  ...L.Icon.Default.prototype.options,
  iconUrl: leafletMarkerIcon,
  iconRetinalUrl: leafletMarkerIconRetina,
  shadowUrl: leafletMarkerIconShadow,
})

import {makeUrl} from './api'
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

class ReIssueApi {
  init() {
    return (this._init || (this._init = this.createInitializer()))
  }

  async createInitializer() {
    return true
  }

  async isValid(response) {
    const isValid = await this.checkResponse(response)
    if (!isValid) {
      delete this._init
    }
    return isValid
  }

  async checkResponse(response) {
    return true
  }

  async api(url, options) {
    const initPhaseOne = await this.init()
    const fetchPhaseOne = await fetch(url, options)
    const isValid = await this.isValid(fetchPhaseOne)
    if (!isValid) {
      await this.init()
      return await fetch(url, options)
    }
    return fetchPhaseOne
  }
}

class ReIssueApiGeoServerLogin extends ReIssueApi {
  constructor(serverDef) {
    super()
    this.serverDef = serverDef
  }

  async createInitializer() {
    const {serverDef} = this
    const form = new URLSearchParams()
    form.set('username', serverDef.username)
    form.set('password', serverDef.password)
    await fetch(`${serverDef.url}/web`, {credentials: 'include', method: 'GET', mode: 'no-cors'})
    return fetch(`${serverDef.url}/j_spring_security_check`, {credentials: 'include', method: 'POST', mode: 'no-cors', body: form})
  }

  async checkResponse(response) {
    const contentType = response.headers.get('Content-Type')
    console.log('contentType', contentType)
    return true
  }

  api(urlSuffix, {credentials = 'include', datatype = 'json', parameters = {}, ...options} = {}) {
    const {serverDef} = this
    const url = new URL(`${serverDef.url}/${urlSuffix}`)
    url.search = new URLSearchParams(parameters)
    return super.api(url, {...options, credentials, datatype})
  }
}

class GeoServerUtil {
  constructor(props) {
    const {servers} = props
    this.servers = Object.keys(servers).reduce((result, serverName) => {
      result[serverName] = new ReIssueApiGeoServerLogin(servers[serverName])
      return result
    }, {})
  }

  async fetch({server, typeName, workspace}) {
    const parameters = {
      ...defaultGeoJSONParamters,
      typeName,
      maxFeatures: 15000,
    }

    const data = await this.servers[server].api(`${workspace}/ows`, {parameters}).then(data => data.json())

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
  {name: 'OSM', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', type: 'tile', checked: true},
]

const overlayLayers = [
  {name: 'US States', workspace: 'gis', layers: 'gis:tl_2017_us_state', type: 'wms'},
  {name: 'Los Angles Water', workspace: 'gis', layers: 'gis:tl_2017_06037_areawater', type: 'wms'},
  {name: 'Los Angles Places', workspace: 'gis', layers: 'gis:tl_2017_06_place', type: 'wms'},

  {name: 'lariac_buildings', workspace: 'gis', layers: 'gis:lariac_buildings', type: 'wms'},
  {name: 'tiger-edges', workspace: 'gis', layers: 'gis:tl_2017_06037_edges', type: 'wms'},
  {name: 'sunset_road_edge', workspace: 'gis', layers: 'gis:sunset_road_edge', type: 'wms', checked: true},
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
const defaultGeoJSONParamters = {
  service: 'WFS',
  version: '1.0.0',
  request: 'getFeature',
  //typeName: 'cite:bc_well_data_wgs',
  //maxFeatures: 3000,
  outputFormat: 'application/json',
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


class DraggableCanvasPosition extends React.Component {
  static defaultProps = {
    onUpdatePoint(id, point) { },
    onCanvasSelect(id) { },
  }

  handleOnClick = event => {
    const {onCanvasSelect, canvas} = this.props
    onCanvasSelect(canvas.get('id'))
  }

  handleOnDragStart = (event) => {
    console.log('dragstart')
  }

  handleOnDrag = (event) => {
    const {allPoints} = this.props
    //console.log('drag', event)
    const {latlng, target} = event
    const {_map: map} = target

    const fixedLatlng = L.GeometryUtil.closest(map, allPoints, latlng)
    target.setLatLng(fixedLatlng)
  }

  handleOnDragEnd = (event) => {
    const {onUpdatePoint, canvas} = this.props
    onUpdatePoint(canvas, event.target.getLatLng())
  }
  
  render() {
    const {selected, canvas, rangePoint, isFirst, isLast, zoom, fovOrientation} = this.props
    const overrides = canvas.get('overrides')
    const {bearing, point} = rangePoint

    const overridePoint = (overrides || []).find(override => override.point)
    const hasOverridePoint = !!overridePoint
    const isFullOpacity = selected || isFirst || isLast || hasOverridePoint

    const isHidden = zoom < 16
    //rotationAngle={hasOverridePoint ? 180 : 0}
    const rotationAngle = bearing + (fovOrientation === 'left' ? 90 : -90)
    return <RotableMarker
      rotationAngle={rotationAngle}
      draggable={isFullOpacity || !isHidden}
      opacity={isFullOpacity ? 1 : isHidden ? 0 : 0.6}
      position={point ? [point.coordinates[1], point.coordinates[0]] : null}
      onClick={this.handleOnClick}
      onDragstart={this.handleOnDragStart}
      onDrag={this.handleOnDrag}
      onDragend={this.handleOnDragEnd}
      onViewportChange={this.onViewportChange}
      />
  }
}

const RangePoints = picked(['range', 'canvas'])(class RangePoints extends React.Component {
  onUpdatePoint = (canvas, point) => {
    const {range, setRangePoint} = this.props
    const rangeId = range.get('id')
    const canvasId = canvas.get('id')
    setRangePoint(rangeId, canvasId, {sourceId: 'web', priority: 1, point})
  }

  render() {
    const {allPoints, zoom, range, points, canvases, canvas, onItemPicked} = this.props
    if (!range || !points || !canvases) return <div/>
    const fovOrientation = range.get('fovOrientation', 'left')
    const selected = canvas ? canvas.get('id') : null
    return <FeatureGroup>
      {canvases.filter(canvas => canvas).map(canvas => {
        const id = canvas.get('id')
        const rangePoint = points.get(id)
        return <DraggableCanvasPosition key={id} zoom={zoom} canvas={canvas} rangePoint={rangePoint} allPoints={allPoints} onUpdatePoint={this.onUpdatePoint} onCanvasSelect={onItemPicked} selected={selected === id} fovOrientation={fovOrientation}/>

      })}
    </FeatureGroup>
  }
})

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
    this.iiifCanvasListLayer = L.geoJSON([], {
    })
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

  buildPatterns(position, zoom, canvasList) {
    let size;
    if (zoom < 14) {
      size = 15
    } else {
      size = Math.pow(2, (zoom - 14)) * 30
    }
    const patterns = []
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
    if (false && canvasList) {
      const readArrowHeadBuilder = LeafletPolylineDecorator.Symbol.marker({
        pixelSize: 25,
        polygon: true,
        pathOptions: {
          stroke: true,
          color: 'red',
        },
      })
      patterns.push({
        offset: 0,
        repeat: `${100 / canvasList.length}%`,
        symbol: {
          buildSymbol: (directionPoint, latLngs, map, i, length) => {
            return readArrowHeadBuilder.buildSymbol(directionPoint, latLngs, map, i, length)
          },
        },
      })
    }
    patterns.push({
      offset: position !== undefined ? `${position}%` : undefined,
      repeat: 0,
      symbol: LeafletPolylineDecorator.Symbol.arrowHead({
        pixelSize: size,
        polygon: true,
        pathOptions: {
          stroke: true,
        },
      }),
    })
    return patterns

  }

  processProps(props, prevState) {
    const {position, canvasList} = props
    const {zoom} = prevState
    const nextState = {}
    if (prevState.position !== position) {
      nextState.position = position
      nextState.patterns = this.buildPatterns(position, zoom, canvasList)
    }
    return nextState
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.processProps(nextProps, this.state))
  }

  onViewportChange = ({center, zoom}) => {
    this.setState({zoom, patterns: this.buildPatterns(this.props.position, zoom, this.props.canvasList)})
    // 14 = 26
    // 15 = 35
    // 16 = 50
  }

  render() {
    const {classes, position, canvases = [], onUpdatePoint, onCanvasSelect, selectedCanvas: selected, placement, fieldOfView} = this.props
    const {data, allPoints, patterns, zoom} = this.state

		const dallas_center = [32.781132, -96.797271]
		const la_center = [34.0522, -118.2437]

    //const selectedCanvas = canvases.find(canvas => selected === canvas.id) || {}
    //const {latlng: selectedPosition, bearing: selectedBearing} = selectedCanvas
    return <div className={classes.root}>
      <Map className={classes.map} center={la_center} zoom={11} onViewportChange={this.onViewportChange}>
        <ScaleControl/>
			 	<LayersControl>
          {baseLayers.map(layerDef => renderLayer(LayersControl.BaseLayer, layerDef))}
          {overlayLayers.map(layerDef => renderLayer(LayersControl.Overlay, layerDef, this.onSegment))}
          <LayersControl.Overlay name='sunset-road' checked={true}>
            <GISGeoJSON data={data}/>
          </LayersControl.Overlay>
          <LayersControl.Overlay name='iiif-canvaslist' checked={true}>
            <RangePoints allPoints={allPoints}/>
          </LayersControl.Overlay>
			 	</LayersControl>
        <LeafletPolylineDecorator latlngs={allPoints} patterns={patterns}/>
        <CameraPosition zoom={zoom}/>
      </Map>
    </div>
  }
}

export default withStyles(styles)(GISMap)
