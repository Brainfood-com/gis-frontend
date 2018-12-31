import flow from 'lodash-es/flow'
import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import Enum from 'es6-enum'
import {fromJS, Set as imSet} from 'immutable'

import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import TextField from '@material-ui/core/TextField'

import {immutableEmptyMap, immutableEmptyOrderedMap, immutableEmptySet} from './constants'
import connectHelper from './connectHelper'
import {makeUrl} from './api'

const DEBUG_USER = Symbol('DEBUG_USER')

export const ACTION = Enum(
  'set-info',
)

const constantPermissions = {
  editor: imSet.of(
    'iiif_tree',
    'iiif_canvas_sliding_list',
    'editor_collection_notes',
    'editor_collection_tags',
    'freeform_collection_tags',
    'editor_manifest_notes',
    'editor_manifest_tags',
    'freeform_manifest_tags',
    'editor_range_fovAngle',
    'editor_range_fovDepth',
    'editor_range_fovOrientation',
    'editor_range_notes',
    'editor_range_tags',
    'freeform_range_tags',
    'editor_canvas_notes',
    'editor_canvas_exclude',
    'editor_canvas_hole',
    'editor_canvas_override',
    'editor_canvas_tags',
    'freeform_canvas_tags',
    'search_map',
    'search_results',
  ).sort(),
  client: imSet.of(
    'iiif_tree',
    'iiif_canvas_sliding_list',
    'client_collection_tags',
    'client_manifest_tags',
    'client_range_tags',
    'client_canvas_tags',
    'search_map',
    'search_results',
  ).sort(),
  workshop: imSet.of(
    'iiif_canvas_sliding_list',
    'search_map',
    'search_results',
  ).sort(),
  anonymous: imSet.of(
  ).sort(),
}

const defaultState = immutableEmptyMap.withMutations(map => {
  map.set('permissions', immutableEmptySet)
  //constantPermissions.editor)
  map.set('name', null)
  map.set('username', null)
  map.set('isLoggedIn', false)
  map.set('loginMessage', null)
})

export function checkPermissions(permissions, role, model, attr) {
  if (role === null) {
    return permissions.has(`${model}_${attr}`)
  }
  return permissions.has(`${role}_${model}_${attr}`)
}

function processLoginBackendResponse(dispatch, getState, results) {
  const {
    isLoggedIn,
    name,
    permissions = [],
  } = results
  dispatch({
    type: 'user',
    actionType: ACTION['set-info'],
    isLoggedIn,
    name,
    permissions,
  })
}

export const login = (username, password) => async (dispatch, getState) => {
  const dataToSend = new URLSearchParams()
  dataToSend.append('username', username)
  dataToSend.append('password', password)
  processLoginBackendResponse(dispatch, getState, await fetch(new URL(makeUrl('api', 'user/login')), {
    credentials: 'include',
    method: 'POST',
    body: dataToSend,
  }).then(data => data.json()))
}

export const logout = () => async (dispatch, getState) => {
  processLoginBackendResponse(dispatch, getState, await fetch(new URL(makeUrl('api', 'user/logout')), {
    credentials: 'include',
    method: 'POST',
  }).then(data => data.json()))
}

export function reducer(state = defaultState, {type, actionType, ...rest}) {
  if (type !== 'user') {
    return state
  }
  switch (actionType) {
    case ACTION['set-info']:
      const {isLoggedIn, name, permissions} = rest
      state = state.set('isLoggedIn', isLoggedIn)
      state = state.set('name', name)
      state = state.set('permissions', imSet.of(...permissions).sort())
      break
  }
  return state
}

export const fetchPermissions = () => async (dispatch, getState) => {
  const permissions = await fetch(makeUrl('api', 'user/permissions'), {method: 'POST'}).then(data => data.json())
  console.log('permissions', permissions)
}

export const getUserInfo = () => async (dispatch, getState) => {
  processLoginBackendResponse(dispatch, getState, await fetch(makeUrl('api', 'user/info'), {credentials: 'include'}).then(data => data.json()))
}

export const startOfDay = () => async (dispatch, getState) => {
  //dispatch(fetchPermissions())
  dispatch(getUserInfo())
}

export const picked = (...picked) => Component => {
  const mapDispatchToProps = {}
  picked.forEach(type => {
    switch (type) {
      case 'auth':
        mapDispatchToProps.login = login
        mapDispatchToProps.logout = logout
        break
      case DEBUG_USER:
        mapDispatchToProps.setPermissionType = permissionType => (dispatch, getState) => {
          dispatch({type: 'user', actionType: ACTION['set-permissions'], permissionType})
        }
        break
      case 'permissions':
        break
    }
  })
  function mapStateToProps(store, props) {
    const {user} = store
    const permissions = user.get('permissions')
    return picked.reduce((result, type) => {
      switch (type) {
        case 'auth':
          result.name = user.get('name')
          result.isLoggedIn = user.get('isLoggedIn')
          break
        case DEBUG_USER:
          result.user = user
          result.permissionType = Object.entries(constantPermissions).reduce((result, [key, value]) => {
            if (permissions.equals(value)) {
              return key
            } else {
              return result
            }
          }, 'server')
          break
        case 'permissions':
          result.permissions = permissions
          break
      }
      return result
    }, {})
  }
  return connectHelper({mapStateToProps, mapDispatchToProps})(function PermissionWrapper(props) {
    return <Component {...props}/>
  })
}

const loginFormStyles = {
}

export const LoginForm = flow(picked('auth'), withStyles(loginFormStyles))(class LoginForm extends React.Component {
  state = {username: 'adam@brainfood.com', password: '1234'}

  handleLogout = event => {
    this.props.logout()
  }

  handleLogin = event => {
    const {username, password} = this.state
    this.props.login(username, password)
  }

  handleInputChange = event => {
    const {name, value, checked} = event.currentTarget
    this.setState({[name]: value})
  }

  render() {
    const {isLoggedIn, name} = this.props
    if (isLoggedIn) {
      return <Paper>
        <Typography>Welcome back, {name}!</Typography>
        <Button onClick={this.handleLogout}><Typography>logout</Typography></Button>
      </Paper>
    } else {
      return <Paper>
        <TextField name='username' label='Username' value={this.state.username} onChange={this.handleInputChange}/>
        <TextField name='password' label='Password' value={this.state.password} onChange={this.handleInputChange}/>
        <Button onClick={this.handleLogin}><Typography>login</Typography></Button>
      </Paper>
    }
  }
})

const debugUserStyles = {
}

export const DebugUser = flow(picked(DEBUG_USER), withStyles(debugUserStyles))(class DebugUser extends React.Component {
  handleInputChange = event => {
    const {name, value, checked} = event.currentTarget
    switch (name) {
      case 'permissionType':
        this.props.setPermissionType(value)
        break
    }
  }

  render() {
    const {permissionType, user} = this.props
    return <div>
      <FormControl>
        <FormLabel>Permission Type</FormLabel>
        <RadioGroup row name='permissionType' value={permissionType} onChange={this.handleInputChange} margin='dense'>
          <FormControlLabel value='editor' control={<Radio color='primary' />} label='Editor' margin='dense'/>
          <FormControlLabel value='client' control={<Radio color='primary' />} label='Client' margin='dense'/>
          <FormControlLabel value='anonymous' control={<Radio color='primary' />} label='Anonymous' margin='dense'/>
          <FormControlLabel value='server' control={<Radio color='primary' />} label='Server' margin='dense'/>
        </RadioGroup>
      </FormControl>
    </div>
  }
})

