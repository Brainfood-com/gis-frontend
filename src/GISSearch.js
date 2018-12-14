import Enum from 'es6-enum'
import flow from 'lodash-es/flow'
import React from 'react'

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
)

const defaultState = immutableEmptyMap.withMutations(map => {
  map.set('addresses', immutableEmptyList)
})

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
  }
  return state
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
    address: null,
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
            <IconButton className={classes.searchButton} mini variant='fab' name='search' onClick={this.handleSearch}><SearchIcon/></IconButton>
          </InputAdornment>,
          endAdornment: <InputAdornment position='end'>
            <IconButton className={classes.settingsButton} mini variant='fab' name='facets'><SettingsIcon/></IconButton>
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

