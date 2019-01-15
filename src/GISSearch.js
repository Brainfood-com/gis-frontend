import Enum from 'es6-enum'
import flow from 'lodash-es/flow'
import React from 'react'
import {fromJS} from 'immutable'
import polylabel from 'polylabel'

import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'

import TextField from '@material-ui/core/TextField'
import CloseIcon from '@material-ui/icons/Close'
import SettingsIcon from '@material-ui/icons/Settings'
import SearchIcon from '@material-ui/icons/Search'
import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import FormControl from '@material-ui/core/FormControl'
import InputAdornment from '@material-ui/core/InputAdornment'

import { FeatureGroup, GeoJSON, Popup, PropTypes as LeafletPropTypes } from 'react-leaflet'

import { requiredRoles } from './User'
import { makeUrl } from './api'
import connectHelper from './connectHelper'
import { immutableEmptyList, immutableEmptyMap } from './constants'
import GISGeoJSON from './GISGeoJSON'
import Taxdata from './Taxdata'
import { BusyPane } from './GlobalBusy'
import { CollectionTitle } from './iiif/Collection'
import { ManifestTitle } from './iiif/Manifest'
import { RangeTitle } from './iiif/Range'
import { ensureBuildings, iiifLocalCache } from './iiif/redux'
import { byId as iiifPickedById } from './iiif/Picked'
import { CanvasCardRO } from './iiif/Canvas'
import { getCollection, getManifest, detectAndPick } from './iiif/redux'
import AwesomeMarkers from './leaflet/AwesomeMarkers'
import RotatableMarker from './leaflet/RotatableMarker'

const defaultIcon = AwesomeMarkers.icon({
  markerColor: 'blue',
  prefix: 'fa',
  icon: 'film',
})

const ACTION = Enum(
  'clear',
  'setAddresses',
  'setBuildings',
  'requestCurrentBuilding',
  'setCurrentBuilding',
)

const defaultState = immutableEmptyMap.withMutations(map => {
  map.set('addresses', immutableEmptyList)
  map.set('buildings', immutableEmptyMap)
  map.set('buildingStats', fromJS({rangeCount: {}, canvasCount: {}, claimedCount: {}, placedCount: {}}))
  map.set('requestCurrentBuilding', null)
  map.set('currentBuilding', null)
})

function adjustMinMax(stat, value) {
  stat.min = Math.min(stat.min, value)
  stat.max = Math.max(stat.max, value)
}

export function reducer(state = defaultState, {type, action, ...rest}) {
  if (type !== 'gis-search') {
    return state
  }
  switch (action) {
    case ACTION.clear:
      state = defaultState
      break
    case ACTION.setAddresses:
      state = state.merge(rest)
      break
    case ACTION.setBuildings:
      const buildings = state.get('buildings').withMutations(map => {
        const {buildings, rangeId} = rest
        const newIds = Object.keys(buildings).reduce((newIds, id) => {
          newIds[id] = true
          return newIds
        }, {})
        const oldIds = {}
        for (const [key, value] of map.entries()) {
          if (newIds[key]) {
            delete newIds[key]
          } else if (rangeId) {
            if (value.rangeIds.indexOf(rangeId) !== -1 && value.rangeIds.length === 1) {
              oldIds[key] = true
            }
          } else {
            oldIds[key] = true
          }
        }
        map.merge(buildings)
        for (const key of Object.keys(oldIds).sort()) {
          map.delete(key)
        }
      })
      state = state.set('buildings', buildings)
      state = state.mergeDeep({
        buildingStats: fromJS(buildings.reduce((stats, building) => {
          adjustMinMax(stats.rangeCount, building.rangeIds.length)
          adjustMinMax(stats.canvasCount, building.canvasIds.length)
          adjustMinMax(stats.claimedCount, building.claimedCount)
          adjustMinMax(stats.placedCount, building.placedCount)
          return stats
        }, {
          rangeCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
          canvasCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
          claimedCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
          placedCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
        })),
      })
      break
    case ACTION.requestCurrentBuilding:
      state = state.set('requestCurrentBuilding', rest.requestCurrentBuilding)
      break
    case ACTION.setCurrentBuilding:
      const {currentBuilding} = rest
      if (currentBuilding !== null) {
        const {building: {id}} = currentBuilding
        const requestCurrentBuilding = state.get('requestCurrentBuilding')
        if (id === requestCurrentBuilding) {
          state = state.set('currentBuilding', currentBuilding)
        }
      } else {
        state = state.set('currentBuilding', currentBuilding)
      }
      break
  }
  return state
}

export const refreshBuildings = ({rangeId} = {}) => async (dispatch, getState) => {
  const buildings = await fetch(makeUrl('api', `buildingsPlaced${rangeId ? '/' + rangeId : ''}`)).then(data => data.json())
  dispatch({
    type: 'gis-search',
    action: ACTION.setBuildings,
    rangeId,
    buildings: buildings.reduce((byId, building) => {
      byId[building.buildingId] = building
      return byId
    }, {}),
  })
}

export const startOfDay = () => async (dispatch, getState) => {
  dispatch(refreshBuildings())
}

export const doSearch = searchContext => async (dispatch, getState) => {
  const {
    address,
    radius,
  } = searchContext
  if (address === null || address === undefined) {
    return
  }
  if (address.length === 0) {
    dispatch({type: 'gis-search', action: ACTION.clear})
    return
  }
  const searchURL = new URL(makeUrl('api', 'search'))
  searchURL.search = new URLSearchParams({
    address,
  })
  const addresses = await fetch(searchURL.toString()).then(data => data.json())

  dispatch({
    type: 'gis-search',
    action: ACTION.setAddresses,
    addresses,
  })
}

const pick = (...picked) => Component => {
  const mapDispatchToProps = {}
  picked.forEach(item => {
    switch (item) {
      case 'buildings':
        mapDispatchToProps.showBuilding = showBuilding
        break
      case 'currentBuilding':
        mapDispatchToProps.clearCurrentBuilding = clearCurrentBuilding
        mapDispatchToProps.showRange = showRange
        break;
      case 'search':
        mapDispatchToProps.doSearch = doSearch
        break
    }
  })

  function mapStateToProps(store, props) {
    const {search} = store
    const result = {}
    let isBusy = false
    picked.forEach(item => {
      switch (item) {
        case 'addresses':
          result.addresses = search.get('addresses')
          break
        case 'buildings':
          result.buildings = search.get('buildings')
          result.buildingStats = search.get('buildingStats')
          result.requestCurrentBuilding = search.get('requestCurrentBuilding')
          break
        case 'currentBuilding':
          const requestCurrentBuilding = result.requestCurrentBuilding = search.get('requestCurrentBuilding')
          const currentBuilding = search.get('currentBuilding') || {}
          if (requestCurrentBuilding !== null) {
            const isLoaded = (currentBuilding.building || {}).id === requestCurrentBuilding
            if (isLoaded) {
              result.currentBuilding = currentBuilding
            } else {
              isBusy = true
            }
          }
          break;
      }
    })
    result.isBusy = isBusy
    return result
  }

  return connectHelper({mapStateToProps, mapDispatchToProps})(Component)
}

export const showBuilding = id => async (dispatch, getState) => {
  dispatch({
    type: 'gis-search',
    action: ACTION.requestCurrentBuilding,
    requestCurrentBuilding: id,
  })
  const searchURL = new URL(makeUrl('api', 'buildings'))
  searchURL.search = new URLSearchParams({id})

  const building = (await fetch(searchURL.toString()).then(data => data.json()))[0]
  const canvasesURL = new URL(makeUrl('api', 'buildings/' + id + '/canvases'))
  const canvasPoints = {}
  const allBuildings = {}
  const canvases = await fetch(canvasesURL.toString()).then(data => data.json()).then(canvases => canvases.map(canvas => {
    const {id, range_id, iiif_id, format, height, image, thumbnail, width, external_id: externalId, label, overrides, point, buildings, notes, exclude, hole, ...rest} = canvas
    const result = {
      id, range_id, iiif_id, format, height, width, externalId, label, overrides, notes, exclude, hole,
      externalId,
      image: iiifLocalCache(image),
      thumbnail: iiifLocalCache(thumbnail),
    }
    if (point) {
      buildings.forEach(id => allBuildings[id] = true)
      result.point = {
        latlng: {
          lat: point.coordinates[1],
          lng: point.coordinates[0],
        },
        point,
        buildings,
      }
    }
    return result
  }))
  dispatch(ensureBuildings(Object.keys(allBuildings)))

  const canvasesByRange = canvases.reduce((result, canvas) => {
    const {range_id: rangeId} = canvas
    const rangeCanvases = result[rangeId] || (result[rangeId] = [])
    rangeCanvases.push(canvas)
    return result
  }, {})

  const ranges = await Promise.all(Object.keys(canvasesByRange).map(rangeId => fetch(makeUrl('api', `range/${rangeId}`)).then(data => data.json())))
  const detectTypeUrl = makeUrl('api', 'iiif/detectType')
  const detectTypeOptions = {
		method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
  }

  const locations = await Promise.all(Object.keys(canvasesByRange).map(rangeId => fetch(detectTypeUrl, {...detectTypeOptions, body: JSON.stringify({iiifId: rangeId})}).then(data => data.json())))
  const manifests = {}, collections = {}, parentsByRange = {}
  locations.forEach(location => {
    const manifestId = location.allParents['sc:Manifest'][0]
    const collectionId = location.allParents['sc:Collection'][0]
    const rangeId = location.iiifId
    collections[collectionId] = true
    manifests[manifestId] = true
    parentsByRange[rangeId] = {collectionId, manifestId}
  })
  Object.keys(manifests).map(manifestId => dispatch(getManifest(parseInt(manifestId))))
  Object.keys(collections).map(collectionId => dispatch(getCollection(parseInt(collectionId))))

  //dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['building_canvases'], itemOrItems: {id, canvasesByRange: canvasesByRange}})

  //dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['range'], itemOrItems: rangeDetail.structures})
  //rangeDetail.ranges = rangeDetail.ranges.map(range => range.id)
  dispatch({
    type: 'gis-search',
    action: ACTION.setCurrentBuilding,
    currentBuilding: {
      building,
      canvases,
      canvasPoints,
      parentsByRange,
      canvasesByRange: Object.entries(canvasesByRange).reduce((canvasesByRange, [rangeId, canvases]) => {
        canvasesByRange[rangeId] = canvases.map(canvas => canvas.iiif_id)
        return canvasesByRange
      }, {}),
      primaryCanvasByRange: Object.entries(canvasesByRange).reduce((primaryCanvasByRange, [rangeId, canvases]) => {
        const distanceSortedCanvases = [].concat(canvases).sort((a, b) => a.point_building_distance - b.point_building_distance)
        primaryCanvasByRange[rangeId] = distanceSortedCanvases[0]
        return primaryCanvasByRange
      }, {}),
      ranges,
    },
  })
}

export const clearCurrentBuilding = () => async dispatch => {
  dispatch({
    type: 'gis-search',
    action: ACTION.setCurrentBuilding,
    currentBuilding: null,
  })
  dispatch({
    type: 'gis-search',
    action: ACTION.requestCurrentBuilding,
    requestCurrentBuilding: null,
  })
}

export const showRange = (rangeId, canvasId) => async (dispatch, getState) => {
  dispatch(detectAndPick({iiifId: rangeId, childId: canvasId}))
}

const searchStyles = theme => ({
  root: {
    display: 'flex',
  },
  margin: {
    margin: theme.spacing.unit,
  },
  searchButton: {},
  settingsButton: {},
})

export const Search = flow(withStyles(searchStyles), pick('search'), requiredRoles('search_form'))(class Search extends React.Component {
  state = {
    address: '',
  }

  handleOnKeyPress = event => {
    switch (event.key) {
      case 'Enter':
        this.handleSearch(event)
        break
    }
  }

  handleAddressChange = event => {
    const {value} = event.target
    this.setState({address: value})
  }

  handleSearch = event => {
    event.preventDefault()
    const {address} = this.state
    this.doSearch(address)
  }

  async doSearch(address) {
    this.props.doSearch({address})
  }

  render() {
    const {children, className, classes, hasAllRoles} = this.props
    if (!hasAllRoles) {
      return <div className={classnames(classes.root, classes.margin, className)}/>
    }

    const {address} = this.state
    return <FormControl className={classnames(classes.root, classes.margin, className)}>
      <TextField
        name='address'
        fullWidth
        value={address}
        onChange={this.handleAddressChange}
        onKeyPress={this.handleOnKeyPress}
        InputProps={{
          startAdornment: <InputAdornment position='start'>
            <IconButton className={classes.searchButton} name='search' onClick={this.handleSearch}><SearchIcon/></IconButton>
          </InputAdornment>,
          endAdornment: <InputAdornment position='end'>
            <IconButton className={classes.settingsButton} name='facets'><SettingsIcon/></IconButton>
          </InputAdornment>,
        }}
      />
    </FormControl>
  }
})

const resultAddressesStyles = {
}

const resultAddressColors = {
  locationType_ROOFTOP: 'green',
}
export const MapAddresses = flow(withStyles(resultAddressesStyles), pick('addresses'))(class MapAddresses extends React.Component {
  static contextTypes = {
    map: LeafletPropTypes.map,
  }

  componentDidUpdate() {
    const {addresses} = this.props
    if (addresses && addresses.length === 1) {
      const {map} = this.context
      const {coordinates} = addresses[0].geolocation
      map.setView([coordinates[1], coordinates[0]], 18)
    }
  }

  render() {
    const {className, classes, addresses} = this.props

    return <FeatureGroup>
      {addresses && addresses.map((address, key, index) => {
        const {placeId, geolocation, locationType} = address
        return <React.Fragment key={placeId}>
          <GISGeoJSON data={geolocation} style={{color: resultAddressColors[`locationType_${locationType}`]}}/>
        </React.Fragment>
      })}
    </FeatureGroup>
  }
})

const resultBuildingsStyles = {
}

const choroplethSchemes = {
  //diverging: ['#a50026','#d73027','#f46d43','#fdae61','#fee08b','#ffffbf','#d9ef8b','#a6d96a','#66bd63','#1a9850','#006837'],
  diverging: [
    '#ff0000','#df4600','#c05e00','#a46a00','#7f7500','#547c00','#008000',
    '#547c00', '#7f7500', '#a46a00', '#c05e00', '#df4600', '#ff0000',
  ],
  growing: ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#006d2c','#00441b'],
}

function makeChoropleth(scheme, min, max) {
  const colors = choroplethSchemes[scheme]
  const range = max - min
  const adjust = (colors.length - 1) / range

  return value => {
    const index = Math.floor((value - min) * adjust)
    return colors[index]
  }
}

const MapBuilding = class MapBuilding extends React.Component {
  state = {buildingPoint: null}

  static defaultProps = {
    showBuilding(buildingId) {},
  }

  static getDerivedStateFromProps(props, state) {
    const {isSelected} = props
    if (isSelected) {
      const {building} = props
      const {geojson} = building
      const buildingPoint = polylabel(geojson.coordinates[0], 1.0)
      return {buildingPoint: {lat: buildingPoint[1], lng: buildingPoint[0]}}
    } else {
      return {buildingPoint: null}
    }
  }

  handleOnClick = event => {
    const {building, showBuilding} = this.props
    const {buildingId} = building
    showBuilding(buildingId)
  }

  render() {
    const {isSelected, building, rangeChoropleth, canvasChoropleth, doneChoropleth} = this.props
    const {buildingPoint} = this.state
    const {rangeIds, canvasIds, claimedCount, placedCount, geojson} = building
    const buildingStyle = {
      color: rangeChoropleth(rangeIds.length),
      fillColor: doneChoropleth(Math.abs(claimedCount - placedCount)),
      fillOpacity: 0.8,
    }
    return <FeatureGroup>
      {buildingPoint && <RotatableMarker
        icon={defaultIcon}
        rotationAngle={0}
        position={buildingPoint}
        />
      }
      <GISGeoJSON data={geojson} style={buildingStyle} onClick={this.handleOnClick}/>
    </FeatureGroup>
  }
}

export const MapBuildings = flow(withStyles(resultBuildingsStyles), pick('buildings'))(class MapBuildings extends React.Component {
  state = {}
  static getDerivedStateFromProps(props, state) {
    const {buildingStats} = props
    const rangeCount = buildingStats.get('rangeCount')
    const canvasCount = buildingStats.get('canvasCount')
    const claimedCount = buildingStats.get('claimedCount')
    const placedCount = buildingStats.get('placedCount')

    const rangeChoropleth = makeChoropleth('diverging', rangeCount.get('min'), rangeCount.get('max'))
    const canvasChoropleth = makeChoropleth('growing', canvasCount.get('min'), canvasCount.get('max'))
    const doneChoropleth = makeChoropleth('growing', 0, placedCount.get('max'))

    return {
      rangeChoropleth,
      canvasChoropleth,
      doneChoropleth,
    }
  }

  handleShowBuilding = buildingId => {
    const {buildings, showBuilding} = this.props
    const foundBuilding = buildings.get('' + buildingId)
    showBuilding(buildingId)
  }

  rangeChoropleth = value => this.state.rangeChoropleth(value)
  canvasChoropleth = value => this.state.canvasChoropleth(value)
  doneChoropleth = value => this.state.doneChoropleth(value)

  render() {
    const {className, classes, buildings, buildingStats, requestCurrentBuilding} = this.props

    return <FeatureGroup>
      {buildings && buildings.map((building, key, index) => <MapBuilding key={`${building.buildingId === requestCurrentBuilding}:${building.buildingId}`} building={building}
        rangeChoropleth={this.rangeChoropleth}
        canvasChoropleth={this.canvasChoropleth}
        doneChoropleth={this.doneChoropleth}
        showBuilding={this.handleShowBuilding}
        isSelected={building.buildingId === requestCurrentBuilding}
        />).toIndexedSeq()}
    </FeatureGroup>
  }
})

const currentBuildingInfoStyles = {
  root: {
    minWidth: 100,
  },
}

const currentBuildingRangeStyles = {
  root: {
    border: '2px solid black',
    marginBottom: 5,
    '&:hover': {
      borderColor: 'white',
    },
  },
  titlePane: {
    cursor: 'pointer',
    padding: 8,
  },
  card: {
    cursor: 'pointer',
    margin: '0 4px 0 4px',
  }
}
const CurrentBuildingRange = flow(iiifPickedById('collection', 'manifest'), withStyles(currentBuildingRangeStyles))(class CurrentBuildingRange extends React.Component {
  state = {collection: null, manifest: null}

  static getDerivedStateFromProps(props, state) {
    const {collection, manifest} = props
    return {
      collection: collection ? collection.toJS() : null,
      manifest: manifest ? manifest.toJS() : null,
    }
  }

  handleOnClick = event => {
    event.preventDefault()
    this.handleOnItemPicked()
  }

  handleOnItemPicked = () => {
    const {range: {id}, onItemPicked} = this.props
    onItemPicked(id)
  }

  render() {
    const {className, classes, onItemPicked, range, currentBuilding} = this.props
    const {collection, manifest} = this.state
    const {canvasesByRange, primaryCanvasByRange} = currentBuilding
    const {id} = range
    const rangeCanvases = canvasesByRange[id]
    const primaryCanvas = primaryCanvasByRange[id]
    return <div className={classnames(classes.root, className)} key={id}>
      <div className={classes.titlePane} onClick={this.handleOnClick}>
        <CollectionTitle collection={collection}/>
        <ManifestTitle manifest={manifest}/>
        <RangeTitle range={range}/>
      </div>
      <CanvasCardRO className={classes.card} collectionId={collection.id} manifestId={manifest.id} range={range} canvas={primaryCanvas} canvasPoint={primaryCanvas.point} onItemPicked={this.handleOnItemPicked}/>
    </div>
  }
})

export const CurrentBuildingInfo = flow(withStyles(currentBuildingInfoStyles), pick('currentBuilding'))(class CurrentBuildingInfo extends React.Component {
  handleRangeSelection = id => {
    const {showRange, showCanvas, currentBuilding: {primaryCanvasByRange}} = this.props
    const primaryCanvas = primaryCanvasByRange[id]
    showRange(id, primaryCanvas.iiif_id)
  }

  handleOnClose = ev => {
    const {clearCurrentBuilding} = this.props
    clearCurrentBuilding()
  }

  render() {
    const {className, classes, isBusy, requestCurrentBuilding, currentBuilding} = this.props
    if (!requestCurrentBuilding) {
      return <div />
    }
    const {
      building: {taxdata} = {},
      ranges = [],
      parentsByRange,
    } = (currentBuilding || {})
    return <div className={classnames(classes.root, className)}>
      <BusyPane isBusy={isBusy}>
        <IconButton onClick={this.handleOnClose}><CloseIcon/></IconButton>
        <Taxdata taxdata={taxdata}/>
        {ranges.map(range => {
          const {id} = range
          const {collectionId, manifestId} = parentsByRange[id]
          return <CurrentBuildingRange key={id} onItemPicked={this.handleRangeSelection} range={range} currentBuilding={currentBuilding} collectionId={collectionId} manifestId={manifestId} />
        })}
      </BusyPane>
    </div>
  }
})

