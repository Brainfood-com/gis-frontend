import flow from 'lodash-es/flow'
import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import Enum from 'es6-enum'
import {fromJS, Set as imSet} from 'immutable'


import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'

import {immutableEmptyMap, immutableEmptyOrderedMap, immutableEmptySet} from './constants'
import connectHelper from './connectHelper'
import {makeUrl} from './api'

const DEBUG_USER = Symbol('DEBUG_USER')

export const ACTION = Enum(
  'set-permissions',
)
export const MODEL = Enum(
)

const constantPermissions = {
  editor: imSet.of(
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
  ).sort(),
  client: imSet.of(
    'client_collection_tags',
    'client_manifest_tags',
    'client_range_tags',
    'client_canvas_tags',
  ).sort(),
  anonymous: imSet.of(
  ).sort(),
}

const defaultState = immutableEmptyMap.withMutations(map => {
  map.set('permissions', constantPermissions.editor)
  map.set('username', null)
  map.set('isLoggedIn', false)
  map.set('loginMessage', null)
})

export function checkPermissions(permissions, role, model, attr) {
  return permissions.has(`${role}_${model}_${attr}`)
}

export const picked = (...picked) => Component => {
  const mapDispatchToProps = {}
  picked.forEach(type => {
    switch (type) {
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

export function reducer(state = defaultState, {type, actionType, ...rest}) {
  if (type !== 'user') {
    return state
  }
  switch (actionType) {
    case ACTION['set-permissions']:
      const newPermissions = constantPermissions[rest.permissionType]
      if (newPermissions) {
        state = state.set('permissions', newPermissions)
      }
      break
  }

  return state
}

export const login = (username, password) => async (dispatch, getState) => {
  const loginiUrl = new URL(makeUrl('login', 'auth'))
  const dataToSend = {username, password}
  const loginResults = await fetch(new URL(makeUrl('login', 'auth')), {
    method: 'POST',
    body: JSON.stringify(dataToSend),
  })

  //const buildingCanvasesResults = await fetch(apiUrl).then(data => data.json())
  //dispatch({type: 'user', actionType: ACTION.clear, modelType: MODEL['collection']})
}
