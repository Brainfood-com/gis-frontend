import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { routerReducer, routerMiddleware, push } from 'react-router-redux'
import createHistory from 'history/createBrowserHistory'
import thunk from 'redux-thunk'

const history = createHistory()
const middleware = routerMiddleware(history)
const enhancer = compose(
  applyMiddleware(middleware, thunk),
  //DevTools.instrument()
)
export const store = createStore(
	combineReducers({
		router: routerReducer,
	}),
	enhancer
)

import { Provider, connect } from 'react-redux'
import { Router, Route } from 'react-router'
import { GeoJSON, Map, TileLayer, WMSTileLayer, LayersControl } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const geoserver = window.location.href.replace(/(https?:\/\/)(.*\.)?gis(\.[^:\/]+(:\d+)?).*/, '$1geoserver.gis$3/geoserver')
const servers = {
  'app': geoserver,
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
        url={`${servers[server]}/gwc/service/tms/1.0.0/${layers}@EPSG:900913@png/{z}/{x}/{-y}.png`}
      />
    case 'geojson':
      return <DelayedGeoJSON server={server} typeName={layers} workspace={workspace}/>
    case 'wms':
      return <WMSTileLayer
        attribution='foo'
        layers={layers}
        transparent={true}
        opacity={0.5}
        format='image/png'
        url={`${servers[server]}/ows?tile=true`}
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
      maxFeatures: 3000,
    }
    const url = new URL(`${servers[server]}/${workspace}/ows`)
    url.search = new URLSearchParams(parameters)
    const form = new URLSearchParams()
    form.set('username', 'admin')
    form.set('password', 'geoserver')
    fetch(`${servers[server]}/j_spring_security_check`, {credentials: 'include', method: 'POST', mode: 'no-cors', body: form}).then(() => {
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

class Home extends React.Component {
  render() {
		const dallas_center = [32.781132, -96.797271]
		const la_center = [34.0522, -118.2437]
    return <div style={{height: 1000, width: '100%'}}>
      <Map center={la_center} zoom={11} style={{height:'100%'}}>
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
class App extends React.Component {
  componentDidMount() {
    //this.props.restoreLocalSession()
  }

  render() {
    console.log('props', this.props)
    return <Provider store={this.props.store}>
				<Router history={this.props.history}>
							<Route exact path="/" component={Home} />
				</Router>
		</Provider>
  }

}

ReactDOM.render(
    <div>
        <App history={history} store={store} />
    </div>,
    document.getElementById('player')
);

