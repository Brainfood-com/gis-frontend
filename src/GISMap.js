import React from 'react'
import PropTypes from 'prop-types'

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
  {name: 'OSM', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', type: 'tile', checked: true},
]

const overlayLayers = [
  {name: 'US States', workspace: 'gis', layers: 'gis:tl_2017_us_state', type: 'wms'},
  {name: 'Los Angles Water', workspace: 'gis', layers: 'gis:tl_2017_06037_areawater', type: 'wms'},
  {name: 'Los Angles Places', workspace: 'gis', layers: 'gis:tl_2017_06_place', type: 'wms'},

  {name: 'lariac_buildings', workspace: 'gis', layers: 'gis:lariac_buildings', type: 'wms'},
  {name: 'tiger-edges', workspace: 'gis', layers: 'gis:tl_2017_06037_edges', type: 'wms'},
  {name: 'sunset_road_edge', workspace: 'gis', layers: 'gis:sunset_road_edges', type: 'geojson', checked: true},
  {name: 'sunset_road_edge_connected', workspace: 'gis', layers: 'gis:sunset_road_edges_connected', type: 'geojson', checked: true},
  {name: 'tiger-roads', workspace: 'gis', layers: 'gis:tl_2017_06037_roads', type: 'wms'},
  {name: 'sunset_buildings', workspace: 'gis', layers: 'gis:sunset_buildings', type: 'wms'},
  {name: 'tiger-roads-tms', workspace: 'gis', layers: 'gis:tl_2017_06037_roads', type: 'geotile'},
  {name: 'lariac_buildings-tms', workspace: 'gis', layers: 'gis:lariac_buildings', type: 'geotile'},
  {name: 'sunset_road-tms', workspace: 'gis', layers: 'gis:sunset_road', type: 'geotile'},
  {name: 'sunset_buildings-tms', workspace: 'gis', layers: 'gis:sunset_buildings', type: 'geotile'},
  {name: 'sunset_buildings-json', workspace: 'gis', layers: 'gis:sunset_buildings', type: 'geojson', checked: false},
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

const debugLine = 
  {"type":"LineString","coordinates":[[-118.555932,34.037982],[-118.555975,34.037832],[-118.555932,34.037982],[-118.555793,34.03843],[-118.55576,34.038537],[-118.555662,34.03853],[-118.555443,34.038525],[-118.555178,34.038526],[-118.554914,34.038535],[-118.554649,34.038552],[-118.554386,34.038576],[-118.554124,34.038608],[-118.55355,34.038694],[-118.550897,34.03937],[-118.550628,34.039424],[-118.550424,34.039454],[-118.550287,34.039469],[-118.550135,34.039478],[-118.550011,34.039487],[-118.549804,34.039491],[-118.549666,34.039488],[-118.549459,34.039476],[-118.548639,34.039401],[-118.548397,34.039391],[-118.548155,34.039391],[-118.547914,34.039402],[-118.547673,34.039423],[-118.546646,34.039557],[-118.546346,34.039586],[-118.546144,34.039598],[-118.546028,34.0396],[-118.545785,34.039603],[-118.545088,34.039545],[-118.544753,34.039494],[-118.544276,34.039382],[-118.543829,34.039245],[-118.543209,34.039062],[-118.542249,34.03885],[-118.541723,34.0387],[-118.541506,34.038634],[-118.541293,34.038561],[-118.541083,34.038482],[-118.540787,34.038358],[-118.540743,34.038338],[-118.540673,34.038307],[-118.540474,34.03821],[-118.540362,34.038151],[-118.540279,34.038108],[-118.539392,34.037624],[-118.538834,34.03733],[-118.538263,34.037047],[-118.537897,34.036866],[-118.537797,34.036818],[-118.537696,34.03677],[-118.537638,34.036742],[-118.537555,34.036702],[-118.536003,34.035953],[-118.535727,34.035814],[-118.535566,34.035715],[-118.535413,34.03561],[-118.534832,34.03516],[-118.534631,34.035015],[-118.53442,34.034882],[-118.534198,34.034761],[-118.534025,34.03468],[-118.528721,34.032487],[-118.52854,34.032417],[-118.528355,34.032356],[-118.528104,34.032286],[-118.527023,34.032059],[-118.526772,34.031986],[-118.526529,34.031899],[-118.525201,34.031342],[-118.525117,34.031307],[-118.524999,34.031251],[-118.524857,34.03119],[-118.523919,34.03072],[-118.522501,34.029966],[-118.521773,34.029562],[-118.520911,34.02905],[-118.52053,34.028805],[-118.520148,34.02861],[-118.519897,34.028494],[-118.519457,34.028283],[-118.519402,34.028244],[-118.51909,34.028058],[-118.518773,34.027872],[-118.517805,34.027338],[-118.517354,34.027107],[-118.516425,34.02665],[-118.515622,34.026232],[-118.514973,34.025909],[-118.51241,34.024581],[-118.512295,34.024519],[-118.511844,34.024241],[-118.511173,34.023794],[-118.510636,34.023432],[-118.508206,34.021531],[-118.50703,34.020612],[-118.506673,34.020339],[-118.506226,34.019997],[-118.50555,34.019472],[-118.504605,34.018713],[-118.503913,34.018172],[-118.503388,34.017766],[-118.50267,34.017198],[-118.502115,34.016768],[-118.501688,34.016418],[-118.500973,34.015831],[-118.500542,34.015459],[-118.500204,34.015156],[-118.500077,34.015041],[-118.499116,34.014148],[-118.498286,34.013402],[-118.49738,34.012565],[-118.496896,34.012152],[-118.496542,34.011864],[-118.496326,34.011742],[-118.496174,34.011665],[-118.495909,34.011545],[-118.495794,34.011504],[-118.495665,34.011477],[-118.495452,34.011444],[-118.495299,34.011426],[-118.495069,34.011423],[-118.494874,34.01143],[-118.494844,34.011405],[-118.494796,34.011365],[-118.494783,34.011354],[-118.494693,34.011365],[-118.494574,34.011381],[-118.4945,34.011396],[-118.494458,34.011405],[-118.494275,34.011448],[-118.494057,34.011522],[-118.493829,34.011633],[-118.493474,34.011823],[-118.492895,34.012151],[-118.492706,34.012245],[-118.4926,34.012292],[-118.492446,34.012343],[-118.492284,34.012385],[-118.492081,34.012427],[-118.491883,34.012451],[-118.49159,34.012466],[-118.490637,34.012491],[-118.490459,34.012492],[-118.489838,34.012592],[-118.489507,34.012677],[-118.489134,34.012812],[-118.488764,34.012981],[-118.48858,34.013081],[-118.487905,34.013472],[-118.487303,34.013847],[-118.486527,34.014294],[-118.486286,34.014439],[-118.486172,34.014515],[-118.485836,34.014713],[-118.485784,34.01475],[-118.484637,34.015466],[-118.483465,34.016223],[-118.482651,34.016779],[-118.482082,34.017203],[-118.481674,34.01753],[-118.481376,34.017766],[-118.481296,34.017831],[-118.481206,34.017901],[-118.480732,34.018277],[-118.480268,34.018655],[-118.480006,34.018868],[-118.47979,34.01905],[-118.479326,34.019441],[-118.47931,34.019454],[-118.478869,34.019811],[-118.47793,34.020571],[-118.477643,34.020803],[-118.477165,34.021189],[-118.476951,34.021369],[-118.476699,34.02158],[-118.47609,34.022078],[-118.475865,34.022245],[-118.47562,34.022404],[-118.475371,34.022548],[-118.475015,34.022727],[-118.474617,34.022889],[-118.474428,34.02297],[-118.474075,34.023099],[-118.473652,34.023249],[-118.472251,34.023624],[-118.471646,34.023788],[-118.470986,34.023966],[-118.469254,34.024428],[-118.469069,34.024479],[-118.467812,34.024817],[-118.467572,34.024883],[-118.467029,34.02502],[-118.466902,34.025052],[-118.465921,34.025296],[-118.465841,34.025316],[-118.464455,34.025691],[-118.462732,34.026166],[-118.462414,34.026253],[-118.461761,34.026424],[-118.460373,34.026721],[-118.460027,34.026786],[-118.459377,34.026915],[-118.458714,34.027061],[-118.458522,34.027101],[-118.458241,34.027153],[-118.45731,34.027362],[-118.456556,34.027503],[-118.455991,34.027609],[-118.455758,34.027635],[-118.455552,34.027652],[-118.455118,34.027677],[-118.454714,34.027673],[-118.454471,34.027676],[-118.453889,34.027646],[-118.453641,34.027635],[-118.452804,34.027572],[-118.452706,34.027569],[-118.452675,34.027569],[-118.452634,34.027571],[-118.452506,34.027571],[-118.452267,34.02757],[-118.452033,34.027579],[-118.451683,34.027606],[-118.451334,34.027649],[-118.45099,34.027706],[-118.450649,34.027778],[-118.450382,34.027848],[-118.449207,34.028157],[-118.448203,34.028423],[-118.447752,34.028543],[-118.447238,34.028679],[-118.446222,34.028949],[-118.444382,34.029422],[-118.444323,34.029437],[-118.444248,34.029455],[-118.444134,34.029483],[-118.444042,34.029506],[-118.443527,34.029633],[-118.443101,34.029729],[-118.442981,34.029755],[-118.442959,34.02976],[-118.442823,34.029789],[-118.442765,34.029799],[-118.442304,34.029894],[-118.441504,34.030039],[-118.440957,34.030128],[-118.440655,34.030171],[-118.440148,34.030242],[-118.438196,34.030518],[-118.437688,34.030594],[-118.43698,34.030692],[-118.436754,34.030732],[-118.436573,34.030764],[-118.435156,34.030963],[-118.433617,34.031169],[-118.433365,34.031214],[-118.433324,34.03122],[-118.432101,34.031388],[-118.431434,34.031469],[-118.431267,34.031486],[-118.430736,34.031539],[-118.430303,34.031572],[-118.429955,34.031597],[-118.429496,34.031623],[-118.429038,34.031642],[-118.428579,34.031655],[-118.428074,34.031663],[-118.428028,34.031664],[-118.427874,34.031663],[-118.426664,34.031659],[-118.42469,34.031653],[-118.424048,34.031652],[-118.423915,34.031652],[-118.422974,34.031657],[-118.421792,34.031663],[-118.420888,34.031668],[-118.419224,34.031677],[-118.419124,34.03168],[-118.418966,34.031686],[-118.418691,34.031696],[-118.41707,34.031704],[-118.416927,34.031705],[-118.416613,34.031707],[-118.415946,34.03171],[-118.415844,34.031713],[-118.41556,34.031708],[-118.415135,34.031684],[-118.414852,34.031658],[-118.414431,34.031603],[-118.414153,34.031556],[-118.413739,34.031472],[-118.413394,34.031386],[-118.413182,34.031324],[-118.413063,34.03129],[-118.412667,34.031158],[-118.41108,34.030583],[-118.410854,34.030501],[-118.410582,34.030413],[-118.410307,34.030332],[-118.409887,34.030226],[-118.409462,34.030139],[-118.409032,34.03007],[-118.408696,34.030031],[-118.408598,34.03002],[-118.407097,34.029888],[-118.405474,34.029746],[-118.404112,34.029626],[-118.403202,34.029546],[-118.401213,34.029371],[-118.398207,34.029107],[-118.396973,34.029012],[-118.396855,34.029008],[-118.396675,34.029002],[-118.396163,34.028972],[-118.395457,34.028957],[-118.394844,34.028965],[-118.394514,34.028952],[-118.394283,34.028921],[-118.39403,34.028864],[-118.393804,34.028797],[-118.393546,34.028715],[-118.393268,34.028617],[-118.393092,34.028567],[-118.392892,34.028524],[-118.39282,34.028514],[-118.392676,34.028499],[-118.392444,34.028473],[-118.392212,34.028447],[-118.392007,34.028433],[-118.391917,34.028427],[-118.390417,34.028306],[-118.3902,34.02806],[-118.389698,34.028346],[-118.38928,34.028307],[-118.389115,34.028285],[-118.389036,34.028274],[-118.387527,34.028126],[-118.387012,34.028101],[-118.386835,34.027988],[-118.38654,34.028168],[-118.386359,34.028279],[-118.385484,34.028786],[-118.385333,34.028874],[-118.385184,34.02896],[-118.384976,34.029099],[-118.384422,34.029436],[-118.384368,34.029468],[-118.384157,34.029602],[-118.383985,34.029685],[-118.383887,34.029728],[-118.38391,34.029769],[-118.383741,34.029837],[-118.383651,34.029863],[-118.383483,34.029908],[-118.383143,34.030002],[-118.382852,34.030083],[-118.38226,34.030247],[-118.382047,34.030307],[-118.381934,34.030337],[-118.381336,34.030496],[-118.38102,34.030581],[-118.380636,34.030683],[-118.380416,34.030739],[-118.380092,34.030822],[-118.379512,34.030969],[-118.37945,34.030986],[-118.37925,34.031037],[-118.379189,34.031051],[-118.378794,34.031154],[-118.378263,34.03129],[-118.377435,34.031504],[-118.37735,34.031526],[-118.376461,34.031765],[-118.376187,34.031839],[-118.376086,34.031868],[-118.375497,34.032041],[-118.375405,34.032039],[-118.375263,34.032091],[-118.37522,34.032106],[-118.375144,34.032137],[-118.374978,34.032203],[-118.374698,34.032316],[-118.374606,34.032353],[-118.374316,34.032478],[-118.373121,34.032992],[-118.372818,34.033122],[-118.372478,34.033266],[-118.372323,34.033332],[-118.371644,34.033619],[-118.371512,34.033674],[-118.370912,34.033928],[-118.370683,34.03402],[-118.369904,34.034353],[-118.369555,34.034502],[-118.369022,34.034727],[-118.368972,34.034718],[-118.36722,34.034467],[-118.366599,34.034394],[-118.366234,34.034335],[-118.364297,34.034051],[-118.364207,34.034035],[-118.364146,34.034024],[-118.363898,34.033979],[-118.363366,34.033898],[-118.363327,34.033892],[-118.362753,34.033822],[-118.362321,34.033781],[-118.362231,34.033774],[-118.361888,34.033748],[-118.361309,34.03372],[-118.36115,34.033716],[-118.361019,34.033712],[-118.360438,34.033709],[-118.359882,34.033722],[-118.359076,34.03376],[-118.357937,34.033814],[-118.357436,34.033838],[-118.357423,34.033838],[-118.356818,34.033867],[-118.355696,34.03392],[-118.35492,34.033957],[-118.350225,34.034179],[-118.350048,34.034187],[-118.347389,34.034314],[-118.345431,34.034407],[-118.345183,34.034419],[-118.343984,34.034476],[-118.34343,34.034503],[-118.34303,34.034521],[-118.341842,34.034578],[-118.341167,34.03461],[-118.340089,34.034661],[-118.340016,34.034757],[-118.339937,34.03486],[-118.338587,34.034924],[-118.338281,34.034939],[-118.33808,34.034948],[-118.337931,34.034955],[-118.333669,34.035157],[-118.330556,34.035317],[-118.330091,34.035341],[-118.329565,34.035368],[-118.328861,34.035401],[-118.32838,34.035425],[-118.327674,34.03546],[-118.327328,34.035484],[-118.327242,34.035491],[-118.326982,34.035513],[-118.326417,34.035571],[-118.326007,34.035622],[-118.323624,34.035948],[-118.322783,34.036068],[-118.31837,34.036701],[-118.317685,34.036805],[-118.317558,34.036824],[-118.316678,34.036929],[-118.31629,34.03697],[-118.315875,34.037013],[-118.315071,34.037085],[-118.314266,34.037146],[-118.313337,34.037202],[-118.313213,34.037209],[-118.312285,34.037246],[-118.311476,34.037266],[-118.310668,34.037274],[-118.30986,34.037271],[-118.309271,34.037263],[-118.308987,34.03726],[-118.303872,34.0372],[-118.303075,34.037252],[-118.301951,34.037308],[-118.301421,34.037316],[-118.300674,34.037309],[-118.300273,34.037304],[-118.2967,34.037262],[-118.296274,34.037275],[-118.295459,34.0373],[-118.29486,34.037274],[-118.29155,34.037235],[-118.288439,34.037198],[-118.288416,34.0372],[-118.287913,34.037203],[-118.287586,34.037211],[-118.285387,34.037237],[-118.284951,34.037258],[-118.284661,34.03729],[-118.28438,34.037313],[-118.284013,34.037381],[-118.283832,34.037414],[-118.28332,34.037521],[-118.282853,34.037618],[-118.281547,34.037893],[-118.280897,34.03803],[-118.280601,34.038089],[-118.28032,34.038139],[-118.279933,34.038207],[-118.279357,34.03829],[-118.279067,34.038325],[-118.278963,34.038335],[-118.278487,34.038382],[-118.276817,34.038502],[-118.276507,34.038528],[-118.276199,34.038569],[-118.275994,34.038605],[-118.275665,34.038685],[-118.275342,34.038779],[-118.27512,34.038853],[-118.275098,34.038861],[-118.274971,34.03892],[-118.274852,34.038989],[-118.274725,34.039083],[-118.274606,34.039194],[-118.274506,34.039306],[-118.274443,34.039402],[-118.274371,34.039513],[-118.274313,34.039643],[-118.274271,34.039779],[-118.274078,34.040818],[-118.273974,34.041272],[-118.273937,34.041452],[-118.273876,34.041675],[-118.27384,34.041776],[-118.273765,34.041954],[-118.273665,34.042155],[-118.273359,34.042678],[-118.273178,34.042955],[-118.27284,34.043405],[-118.272635,34.043669],[-118.272371,34.043985],[-118.272104,34.044254],[-118.271971,34.044375],[-118.271547,34.044762],[-118.271344,34.044932],[-118.271213,34.04503],[-118.271042,34.045158],[-118.270802,34.045357],[-118.270548,34.045553],[-118.270492,34.045596],[-118.270171,34.045824],[-118.270034,34.045915],[-118.268926,34.046608],[-118.268734,34.046728],[-118.268485,34.046884],[-118.268279,34.047001],[-118.266839,34.047882],[-118.26673,34.047945],[-118.266642,34.047997],[-118.266031,34.048354],[-118.264886,34.049051],[-118.264295,34.049419],[-118.264046,34.049576],[-118.263708,34.049781],[-118.262916,34.050249],[-118.262787,34.050327],[-118.261169,34.051308],[-118.260389,34.051781],[-118.260107,34.051958],[-118.259821,34.052152],[-118.259694,34.052247],[-118.259421,34.052467],[-118.259363,34.052517],[-118.259205,34.052653],[-118.259005,34.052839],[-118.25881,34.052816],[-118.258542,34.052786],[-118.258091,34.052735],[-118.257838,34.052707],[-118.257708,34.052623],[-118.257158,34.052265],[-118.255898,34.053606],[-118.25586,34.053646],[-118.255815,34.053694],[-118.254535,34.055052],[-118.25447,34.055121],[-118.253401,34.054434],[-118.253373,34.054452],[-118.253071,34.054673],[-118.252922,34.054751],[-118.252739,34.05483],[-118.252531,34.054894],[-118.252237,34.054972],[-118.251926,34.055024],[-118.251782,34.055048],[-118.25134,34.055127],[-118.251081,34.055241],[-118.250895,34.055373],[-118.250712,34.05553],[-118.250052,34.056232],[-118.249838,34.056391],[-118.248755,34.055692],[-118.247665,34.055003],[-118.246585,34.054338],[-118.245518,34.055459],[-118.244892,34.056126],[-118.244722,34.056289],[-118.244487,34.056494],[-118.244211,34.056694],[-118.243936,34.056869],[-118.243722,34.056989],[-118.24328,34.057223],[-118.243099,34.057319],[-118.243032,34.057354],[-118.242956,34.057394],[-118.242782,34.057487],[-118.242739,34.057461],[-118.242665,34.057418],[-118.242571,34.057368],[-118.242461,34.057321],[-118.242164,34.057222],[-118.242043,34.057352],[-118.241921,34.057456],[-118.241805,34.057535],[-118.241659,34.057613],[-118.241384,34.057742],[-118.240844,34.057995],[-118.240708,34.058074],[-118.240583,34.058161],[-118.240467,34.058256],[-118.240361,34.05836],[-118.240208,34.058551],[-118.23954,34.058264],[-118.239509,34.05826],[-118.239208,34.058224],[-118.239019,34.058214],[-118.238692,34.058221],[-118.23784,34.058247]]}
  


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

  processProps(props, prevState) {
    const {position, canvasList} = props
    const {zoom} = prevState
    const nextState = {}
    if (prevState.position !== position) {
      nextState.position = position
    }
    return nextState
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.processProps(nextProps, this.state))
  }

  onViewportChange = ({center, zoom}) => {
    this.setState({zoom})
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

  render() {
    const {classes} = this.props
    const {data, allPoints, zoom} = this.state

		const dallas_center = [32.781132, -96.797271]
		const la_center = [34.0522, -118.2437]

    return <div className={classes.root}>
      <Map className={classes.map} center={la_center} zoom={11} onViewportChange={this.onViewportChange} onLoading={this.handleOnLoading} onLoad={this.handleOnLoad}>
        <ScaleControl/>
			 	<LayersControl>
          {baseLayers.map(layerDef => renderLayer(LayersControl.BaseLayer, layerDef))}
          {overlayLayers.map(layerDef => renderLayer(LayersControl.Overlay, layerDef))}
          <LayersControl.Overlay name='sunset-road' checked={true}>
            <GISGeoJSON data={data}/>
          </LayersControl.Overlay>
          <LayersControl.Overlay name='iiif-canvaslist' checked={true}>
            <RangePoints zoom={zoom} allPoints={allPoints}/>
          </LayersControl.Overlay>
          <LayersControl.Overlay name='debug-line' checked={true}>
          <GISGeoJSON data={debugLine}/>
          </LayersControl.Overlay>
			 	</LayersControl>
        <CameraPosition zoom={zoom}/>
        <ViewGeoJSON/>
      </Map>
    </div>
  }
}

export default withStyles(styles)(GISMap)
