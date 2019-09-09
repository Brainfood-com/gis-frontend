import flow from 'lodash-es/flow'
import React from 'react'
import ReactGA from 'react-ga'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import Enum from 'es6-enum'
import {fromJS, Set as imSet} from 'immutable'

import ArrowForwardIcon from '@material-ui/icons/ArrowForward'
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

const defaultState = immutableEmptyMap.withMutations(map => {
  map.set('permissions', immutableEmptySet)
  map.set('name', null)
  map.set('username', null)
  map.set('isLoggedIn', false)
  map.set('loginMessage', null)
})

export function checkPermission(permissions, role, model, attr) {
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
  if (isLoggedIn) {
    ReactGA.set({userId: name})
  } else {
    ReactGA.set({userId: undefined})
  }
  ReactGA.event({category: 'Login', action: 'response'})
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
  ReactGA.event({category: 'Login', action: 'login-submit'})
  processLoginBackendResponse(dispatch, getState, await fetch(new URL(makeUrl('api', 'user/login')), {
    credentials: 'include',
    method: 'POST',
    body: dataToSend,
  }).then(data => data.json()))
}

export const logout = () => async (dispatch, getState) => {
  ReactGA.event({category: 'Login', action: 'logout-submit'})
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
  ReactGA.event({category: 'Login', action: 'user-info-submit'})
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
          break
        case 'permissions':
          result.permissions = permissions
          break
      }
      return result
    }, {})
  }
  return connectHelper({mapStateToProps, mapDispatchToProps})(class PermissionWrapper extends React.Component {
    render() {
      return <Component {...this.props}/>
    }
  })
}

export const requiredRoles = (...roles) => Component => picked('permissions')(({permissions, ...props}) => {
  const hasAllRoles = roles.reduce((result, role) => permissions.has(role) ? result : false, true)
  return <Component {...props} hasAllRoles={hasAllRoles}/>
})

const loginFormStyles = {
}

export const LoginForm = flow(picked('auth'), withStyles(loginFormStyles))(class LoginForm extends React.Component {
  state = {username: '', password: ''}

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
      return <div>
        <Typography variant='subtitle1'>Welcome back, {name}!</Typography>
        <Button onClick={this.handleLogout} mini variant='text' color='secondary'>Logout</Button>
      </div>
    } else {
      return <div>
        <TextField name='username' label='Username' value={this.state.username} onChange={this.handleInputChange}/>
        <TextField name='password' label='Password' value={this.state.password} onChange={this.handleInputChange} type='password'/>
        <Button onClick={this.handleLogin} mini variant='contained' color='secondary'>Login <ArrowForwardIcon/></Button>
      </div>
    }
  }
})

const debugUserStyles = {
}

export const DebugUser = flow(picked(DEBUG_USER), withStyles(debugUserStyles))(class DebugUser extends React.Component {
  handleInputChange = event => {
    const {name, value, checked} = event.currentTarget
    switch (name) {
    }
  }

  render() {
    const {user} = this.props
    return <div>
      <FormControl>
      </FormControl>
    </div>
  }
})

