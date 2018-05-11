import React from 'react'

import { withStyles } from 'material-ui/styles'

import { GeoJSON, Map, TileLayer, WMSTileLayer, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
  
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

const geoserver = window.location.href.replace(/(https?:\/\/)(.*\.)?gis(\.[^:\/]+(:\d+)?).*/, '$1geoserver.gis$3/geoserver')
const servers = {
  'app': {
    url: geoserver,
    username: 'admin',
    password: 'geoserver',
  },
}
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
  {name: 'sunset_buildings-json', workspace: 'gis', layers: 'gis:sunset_buildings', type: 'geojson'},
  {name: 'sunset_road-json', workspace: 'gis', layers: 'gis:sunset_road', type: 'geojson'},
  {name: 'sunset_road_merged-json', workspace: 'gis', layers: 'gis:sunset_road_merged', type: 'geojson'},
//  {name: 'sunset_taxdata_2017-json', workspace: 'gis', layers: 'gis:sunset_taxdata_2017', type: 'geojson'},
  {name: 'sunset_taxdata_2017_buildings-json', workspace: 'gis', layers: 'gis:sunset_taxdata_2017_buildings', type: 'geojson'},
]
function renderLayer(layerDefOrig) {
  const {
    layers,
    name,
    server: server = 'app',
    type,
    workspace,
    url: url,
    ...layerDef
  } = layerDefOrig
  switch (type) {
    case 'tile':
      return <TileLayer
        attribution='foo'
        url={url}
      />
    case 'geotile':
      return <TileLayer
        attribution='foo'
        url={`${servers[server].url}/gwc/service/tms/1.0.0/${layers}@EPSG:900913@png/{z}/{x}/{-y}.png`}
      />
    case 'geojson':
      const colorFetcher = buildListFetcher(colorList)
      return <DelayedGeoJSON server={server} typeName={layers} workspace={workspace} style={(feature) => {
        return {color: colorFetcher()}
      }}/>
    case 'wms':
      return <WMSTileLayer
        attribution='foo'
        layers={layers}
        transparent={true}
        opacity={0.5}
        format='image/png'
        url={`${servers[server].url}/ows?tile=true`}
      />
  }
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
    const {server, typeName, workspace} = props
    const parameters = {
      ...defaultGeoJSONParamters,
      typeName,
      maxFeatures: 15000,
    }
    const url = new URL(`${servers[server].url}/${workspace}/ows`)
    url.search = new URLSearchParams(parameters)
    loginBuilder(server).then(() => {
      fetch(url, {credentials: 'include', datatype: 'json'}).then(data => data.json()).then(json => {
        if (this.props.server !== server) {
          return
        }
        if (this.props.typeName !== typeName) {
          return
        }
        if (this.leafletElement) {
          this.leafletElement.clearLayers()
          this.leafletElement.addData(json)
        }
        this.setState({data: json})
      })
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
  render() {
    const {classes} = this.props

		const dallas_center = [32.781132, -96.797271]
		const la_center = [34.0522, -118.2437]
    return <div className={classes.root}>
      <Map className={classes.map} center={la_center} zoom={11}>
			 	<LayersControl>
          {baseLayers.map(({name, ...layerDef}) =>
            <LayersControl.BaseLayer key={name} name={name}>{renderLayer(layerDef)}</LayersControl.BaseLayer>
          )}
          {overlayLayers.map(({name, ...layerDef}) =>
            <LayersControl.Overlay key={name} name={name}>{renderLayer(layerDef)}</LayersControl.Overlay>
          )}
			 	</LayersControl>
      </Map>
    </div>
  }
}

export default withStyles(styles)(GISMap)
