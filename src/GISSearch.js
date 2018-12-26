import Enum from 'es6-enum'
import flow from 'lodash-es/flow'
import React from 'react'
import {fromJS} from 'immutable'

import classnames from 'classnames'
import { withStyles } from '@material-ui/core/styles'

import TextField from '@material-ui/core/TextField'
import SettingsIcon from '@material-ui/icons/Settings'
import SearchIcon from '@material-ui/icons/Search'
import IconButton from '@material-ui/core/IconButton'
import Button from '@material-ui/core/Button'
import FormControl from '@material-ui/core/FormControl'
import InputAdornment from '@material-ui/core/InputAdornment'

import { FeatureGroup, GeoJSON, Popup, PropTypes as LeafletPropTypes } from 'react-leaflet'

import { makeUrl } from './api'
import connectHelper from './connectHelper'
import { immutableEmptyList, immutableEmptyMap } from './constants'
import GISGeoJSON from './GISGeoJSON'

const ACTION = Enum(
  'clear',
  'setAddresses',
  'setBuildings',
)

const defaultState = immutableEmptyMap.withMutations(map => {
  map.set('addresses', immutableEmptyList)
  map.set('buildings', immutableEmptyMap)
  map.set('buildingStats', fromJS({rangeCount: {}, canvasCount: {}, claimedCount: {}, placedCount: {}}))
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
        console.log('oldIds/newIds', {oldIds, newIds})
        map.merge(buildings)
        for (const key of Object.keys(oldIds).sort()) {
          console.log('deleting', key)
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
  console.log('doSearch', {address, radius})
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
        break
      case 'search':
        mapDispatchToProps.doSearch = doSearch
        break
    }
  })

  function mapStateToProps(store, props) {
    const {search} = store
    const result = {}
    picked.forEach(item => {
      switch (item) {
        case 'addresses':
          result.addresses = search.get('addresses')
          break
        case 'buildings':
          result.buildings = search.get('buildings')
          result.buildingStats = search.get('buildingStats')
          break
      }
    })
    return result
  }

  return connectHelper({mapStateToProps, mapDispatchToProps})(Component)
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

export const Search = flow(withStyles(searchStyles), pick('search'))(class Search extends React.Component {
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
    const {children, className, classes} = this.props
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

  console.log('makeChoropleth', scheme, min, max, range, adjust, colors)
  return value => {
    const index = Math.floor((value - min) * adjust)
    return colors[index]
  }
}

const MapBuilding = class MapBuilding extends React.Component {
  state = {buildingPoint: null}

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
      <GISGeoJSON data={geojson} style={buildingStyle}/>
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


  render() {
    const {className, classes, buildings, buildingStats, requestCurrentBuilding} = this.props
    const {rangeChoropleth, canvasChoropleth, doneChoropleth} = this.state

    return <FeatureGroup>
      {buildings && buildings.map((building, key, index) => <MapBuilding key={`${building.buildingId === requestCurrentBuilding}:${building.buildingId}`} building={building}
        rangeChoropleth={rangeChoropleth}
        canvasChoropleth={canvasChoropleth}
        doneChoropleth={doneChoropleth}
        showBuilding={this.handleShowBuilding}
        isSelected={building.buildingId === requestCurrentBuilding}
        />).toIndexedSeq()}
    </FeatureGroup>
  }
})

