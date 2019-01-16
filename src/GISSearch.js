import Enum from 'es6-enum'
import flow from 'lodash-es/flow'
import React from 'react'
import PropTypes from 'prop-types'
import ImmutablePropTypes from 'react-immutable-proptypes'
import {fromJS, Map as imMap, Set as imSet} from 'immutable'
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
import { immutableEmptyList, immutableEmptyMap, immutableEmptySet } from './constants'
import GISGeoJSON from './GISGeoJSON'
import Taxdata, { TaxdataShape } from './Taxdata'
import { BusyPane } from './GlobalBusy'
import { CollectionTitle } from './iiif/Collection'
import { ManifestTitle } from './iiif/Manifest'
import { RangeTitle } from './iiif/Range'
import { ensureBuildings, iiifLocalCache } from './iiif/redux'
import { byId as iiifPickedById } from './iiif/Picked'
import { CanvasCardRO } from './iiif/Canvas'
import { CollectionShape, ManifestShape, RangeShape, CanvasShape } from './iiif/Types'
import { getCollection, getManifest, getRange, detectAndPick } from './iiif/redux'
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
  map.set('buildingStats', fromJS({
    rangeCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
    canvasCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
    claimedCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
    placedCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
  })),
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
        const newBuildings = imMap(buildings.map(building => {
          const {buildingId} = building
          return [buildingId, fromJS(building)]
        }))
        map.deleteAll(map.keySeq().filterNot(buildingId => newBuildings.has(buildingId)))
        map.mergeDeep(newBuildings)
      })
      state = state.set('buildings', buildings)
      const foo = buildings.reduce((stats, building) => {
          adjustMinMax(stats.rangeCount, building.get('rangeIds').size)
          adjustMinMax(stats.canvasCount, building.get('canvasIds').size)
          adjustMinMax(stats.claimedCount, building.get('claimedCount'))
          adjustMinMax(stats.placedCount, building.get('placedCount'))
          return stats
        }, {
          rangeCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
          canvasCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
          claimedCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
          placedCount: {min: Number.MAX_VALUE, max: Number.MIN_VALUE},
        })
      state = state.mergeDeep({
        buildingStats: fromJS(foo),
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
          state = state.set('currentBuilding', fromJS(currentBuilding))
        }
      } else {
        state = state.set('currentBuilding', fromJS(currentBuilding))
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
    buildings,
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
        case 'building':
          const {buildingId} = props
          result.building = search.getIn(['buildings', buildingId])
          result.isSelected = buildingId === search.get('requestCurrentBuilding')
          break
        case 'buildings':
          result.buildings = search.get('buildings')
          result.buildingStats = search.get('buildingStats')
          break
        case 'currentBuilding':
          const requestCurrentBuilding = result.requestCurrentBuilding = search.get('requestCurrentBuilding')
          const currentBuilding = search.get('currentBuilding', immutableEmptyMap)
          if (requestCurrentBuilding !== null && currentBuilding !== null) {
            const isLoaded = currentBuilding.getIn(['building', 'id']) === requestCurrentBuilding
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
  const allBuildings = imSet().asMutable()
  const canvases = imMap().asMutable()
  const canvasesByRange = imMap().asMutable()
  await fetch(canvasesURL.toString()).then(data => data.json()).then(canvasesPojo => canvasesPojo.forEach(canvasPojo => {
    const {id, range_id: rangeId, iiif_id: canvasId, point_building_distance: pointBuildingDistance, format, height, image, thumbnail, width, external_id: externalId, label, overrides, point, buildings, notes, exclude, hole, googleVision, ...rest} = canvasPojo
    const result = {
      id,
      canvasId,
      rangeId,
      point,
      format,
      height,
      width,
      externalId,
      label,
      overrides,
      notes,
      exclude,
      hole,
      googleVision,
      externalId,
      image: iiifLocalCache(image),
      thumbnail: iiifLocalCache(thumbnail),
    }
    if (point) {
      allBuildings.concat(buildings)
      result.point = {
        latlng: {
          lat: point.coordinates[1],
          lng: point.coordinates[0],
        },
        point,
        buildings,
      }
    }
    canvases.set(canvasId, fromJS(result))
    canvasesByRange.updateIn([rangeId], (rangeCanvases = immutableEmptySet) => rangeCanvases.add(canvasId))
  }))
  dispatch(ensureBuildings(allBuildings.toArray()))

  const rangeIdSeq = canvasesByRange.keySeq()
  //const ranges = await Promise.all(rangeIdSeq.map(rangeId => fetch(makeUrl('api', `range/${rangeId}`)).then(data => data.json())))
  const detectTypeUrl = makeUrl('api', 'iiif/detectType')
  const detectTypeOptions = {
		method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
  }

  const locations = await Promise.all(rangeIdSeq.map(rangeId => fetch(detectTypeUrl, {...detectTypeOptions, body: JSON.stringify({iiifId: rangeId})}).then(data => data.json())))
  const parentsByRange = imMap().asMutable()
  const manifestIdSet = imSet().asMutable(), collectionIdSet = imSet().asMutable()
  locations.forEach(location => {
    const manifestId = location.allParents['sc:Manifest'][0]
    const collectionId = location.allParents['sc:Collection'][0]
    const rangeId = location.iiifId
    collectionIdSet.add(collectionId)
    manifestIdSet.add(manifestId)
    parentsByRange.set(rangeId, fromJS({collectionId, manifestId}))
  })
  rangeIdSeq.forEach(rangeId => dispatch(getRange(rangeId)))
  manifestIdSet.forEach(manifestId => dispatch(getManifest(manifestId)))
  collectionIdSet.forEach(collectionId => dispatch(getCollection(collectionId, {full: false})))

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
      canvasesByRange: canvasesByRange.asImmutable(),
      primaryCanvasByRange: canvasesByRange.toKeyedSeq().reduce((primaryCanvasByRange, canvasIdSet, rangeId) => {
        const distanceSortedCanvases = canvasIdSet.sort((a, b) => {
          const canvasA = canvases.get(a)
          const canvasB = canvases.get(b)
          return canvasA.point_building_distance - canvasB.point_building_distance
        })
        return primaryCanvasByRange.set(rangeId, distanceSortedCanvases)
      }, immutableEmptyMap),
      ranges: rangeIdSeq,
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

const MapBuildingShape = ImmutablePropTypes.mapContains({
  buildingId: PropTypes.number.isRequired,
  geojson: ImmutablePropTypes.mapContains({
    coordinates: ImmutablePropTypes.listOf(PropTypes.any),
  }),
  rangeIds: ImmutablePropTypes.listOf(PropTypes.number),
  claimedCount: PropTypes.number,
  placedCount: PropTypes.number,
})
const MapBuildingsShape = ImmutablePropTypes.mapOf(MapBuildingShape, PropTypes.number)

const MapBuilding = flow(pick('building'))(class MapBuilding extends React.Component {
  static propTypes = {
    isSelected: PropTypes.bool,
    building: MapBuildingShape,
    showBuilding: PropTypes.func,
    buildingStyler: PropTypes.func,
  }

  handleOnClick = event => {
    const {buildingId, showBuilding} = this.props
    showBuilding(buildingId)
  }

  buildingStyle = (data) => {
    const {building, buildingStyler} = this.props
    return buildingStyler(building)
  }

  renderMarker() {
    const {isSelected, building} = this.props
    if (!isSelected) return null
    const geojson = building.get('geojson')
    const coordinates = geojson.getIn(['coordinates', 0])
    const buildingPoint = polylabel(coordinates.toJS(), 1.0)
    const position = {lat: buildingPoint[1], lng: buildingPoint[0]}
    return <RotatableMarker
      icon={defaultIcon}
      rotationAngle={0}
      position={position}
    />
  }

  render() {
    const {isSelected, building} = this.props
    if (!building) return <div/>
    const geojson = building.get('geojson')
    return <FeatureGroup>
      {this.renderMarker()}
      <GISGeoJSON data={geojson} style={this.buildingStyle} onClick={this.handleOnClick}/>
    </FeatureGroup>
  }
})

function attachColorizer(stateResult, name, state, scheme, min, max, builder) {
  const {[`${name}Colorizer`]: nameData} = state
  if (nameData && nameData.scheme === scheme && nameData.min === min && nameData.max == max) {
    return
  }
  const func = builder(scheme, min, max)
  stateResult[`${name}Colorizer`] = {
    scheme,
    min,
    max,
    func,
  }
}

const StatShape = ImmutablePropTypes.mapContains({
  min: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
})

export const MapBuildings = flow(withStyles(resultBuildingsStyles), pick('buildings'))(class MapBuildings extends React.Component {
  static propTypes = {
    buildings: MapBuildingsShape,
    buildingStats: ImmutablePropTypes.mapContains({
      rangeCount: StatShape.isRequired,
      canvasCount: StatShape.isRequired,
      claimedCount: StatShape.isRequired,
      placedCount: StatShape.isRequired,
    }).isRequired,
    showBuilding: PropTypes.func.isRequired,
  }

  state = {}
  static getDerivedStateFromProps(props, state) {
    const {buildingStats} = props
    const rangeCount = buildingStats.get('rangeCount')
    const canvasCount = buildingStats.get('canvasCount')
    const claimedCount = buildingStats.get('claimedCount')
    const placedCount = buildingStats.get('placedCount')

    const newState = {}
    attachColorizer(newState, 'range', state, 'diverging', rangeCount.get('min'), rangeCount.get('max'), makeChoropleth)
    attachColorizer(newState, 'canvas', state, 'growing', canvasCount.get('min'), canvasCount.get('max'), makeChoropleth)
    attachColorizer(newState, 'done', state, 'growing', 0, placedCount.get('max'), makeChoropleth)
    return newState
  }

  handleShowBuilding = buildingId => {
    const {buildings, showBuilding} = this.props
    const foundBuilding = buildings.get(buildingId)
    showBuilding(buildingId)
  }

  buildingStyler = building => {
    const {rangeColorizer, doneColorizer} = this.state
    const rangeIds = building.get('rangeIds')
    const claimedCount = building.get('claimedCount')
    const placedCount = building.get('placedCount')
    const buildingStyle = {
      color: rangeColorizer.func(rangeIds.size),
      fillColor: doneColorizer.func(Math.abs(claimedCount - placedCount)),
      fillOpacity: 0.8,
    }
    return buildingStyle
  }

  render() {
    const {className, classes, buildings, buildingStats} = this.props

    return <FeatureGroup>
      {buildings && buildings.map((building, key, index) => <MapBuilding key={building.get('buildingId')} buildingId={building.get('buildingId')}
        buildingStyler={this.buildingStyler}
        showBuilding={this.handleShowBuilding}
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

export const BuildingCanvasShape = ImmutablePropTypes.mapContains({
  id: PropTypes.number,
  point: PropTypes.any,
})

export const CurrentBuildingShape = ImmutablePropTypes.mapContains({
  primaryCanvasByRange: ImmutablePropTypes.mapOf(
    ImmutablePropTypes.setOf(PropTypes.number),
    PropTypes.number
  ),
  building: ImmutablePropTypes.mapContains({
    taxdata: TaxdataShape,
    canvases: ImmutablePropTypes.mapOf(
      BuildingCanvasShape,
      PropTypes.number
    ),
    ranges: ImmutablePropTypes.listOf(PropTypes.number),
    parentsByRange: ImmutablePropTypes.mapOf(
      ImmutablePropTypes.mapContains({
        collectionId: PropTypes.number,
        manifestId: PropTypes.number,
      }),
      PropTypes.number
    )
  }),
})


const CurrentBuildingRange = flow(iiifPickedById('collection', 'manifest', 'range', 'canvas'), withStyles(currentBuildingRangeStyles))(class CurrentBuildingRange extends React.Component {
  static propTypes = {
    onItemPicked: PropTypes.func.isRequired,
    collection: CollectionShape,
    collectionId: PropTypes.number.isRequired,
    manifest: ManifestShape,
    manifestId: PropTypes.number.isRequired,
    range: RangeShape,
    rangeId: PropTypes.number.isRequired,
    canvas: CanvasShape.isRequired,
    canvasId: PropTypes.number.isRequired,
    currentBuilding: CurrentBuildingShape.isRequired,
    buildingCanvas: BuildingCanvasShape.isRequired,
  }

  handleOnClick = event => {
    event.preventDefault()
    this.handleOnItemPicked()
  }

  handleOnItemPicked = () => {
    const {range, onItemPicked} = this.props
    onItemPicked(range.get('id'))
  }

  render() {
    const {className, classes, onItemPicked, collection, manifest, range, rangeId, canvas, buildingCanvas, currentBuilding, collectionId, manifestId} = this.props
    const canvasPoint = buildingCanvas.get('point')
    return <div className={classnames(classes.root, className)} key={rangeId}>
      <div className={classes.titlePane} onClick={this.handleOnClick}>
        <CollectionTitle collection={collection}/>
        <ManifestTitle manifest={manifest}/>
        <RangeTitle range={range}/>
      </div>
      <CanvasCardRO className={classes.card} collection={collection} manifest={manifest} range={range} canvas={buildingCanvas} canvasPoint={canvasPoint} onItemPicked={this.handleOnItemPicked}/>
    </div>
  }
})

export const CurrentBuildingInfo = flow(withStyles(currentBuildingInfoStyles), pick('currentBuilding'))(class CurrentBuildingInfo extends React.Component {
  static propTypes = {
    isBusy: PropTypes.bool.isRequired,
    currentBuilding: CurrentBuildingShape,
    requestCurrentBuilding: PropTypes.number,
    clearCurrentBuilding: PropTypes.func.isRequired,
    showRange: PropTypes.func.isRequired,
  }

  static defaultProps = {
    currentBuilding: immutableEmptyMap,
  }

  handleRangeSelection = id => {
    const {showRange, currentBuilding} = this.props
    const primaryCanvasId = currentBuilding.getIn(['primaryCanvasByRange', id])
    showRange(id, primaryCanvasId)
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
    const taxdata = currentBuilding.getIn(['building', 'taxdata'])
    const ranges = currentBuilding.get('ranges', immutableEmptyList)
    const buildingCanvases = currentBuilding.get('canvases')
    const parentsByRange = currentBuilding.get('parentsByRange')
    const primaryCanvasByRange = currentBuilding.get('primaryCanvasByRange')
    return <div className={classnames(classes.root, className)}>
      <BusyPane isBusy={isBusy}>
        <IconButton onClick={this.handleOnClose}><CloseIcon/></IconButton>
        <Taxdata taxdata={taxdata}/>
        {ranges.map(rangeId => {
          const {collectionId, manifestId} = parentsByRange.get(rangeId).toJSON()
          const primaryCanvasId = primaryCanvasByRange.get(rangeId).first()
          const buildingCanvas = buildingCanvases.get(primaryCanvasId)
          return <CurrentBuildingRange key={rangeId} onItemPicked={this.handleRangeSelection} currentBuilding={currentBuilding} collectionId={collectionId} manifestId={manifestId} rangeId={rangeId} canvasId={primaryCanvasId} buildingCanvas={buildingCanvas} />
        })}
      </BusyPane>
    </div>
  }
})

