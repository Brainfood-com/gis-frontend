import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'
import Enum from 'es6-enum'
import {fromJS} from 'immutable'

import {immutableEmptyMap, immutableEmptyOrderedMap, immutableEmptySet} from './constants'
import connectHelper from './connectHelper'
import {makeUrl} from './api'

export const ACTION = Enum(
  'set-user',
  'delete',
  'clear',
  'incrBusy',
  'decrBusy',
)
export const MODEL = Enum(
)

const defaultState = immutableEmptyMap.withMutations(map => {
  map.set('permissions', immutableEmptySet.withMutations(set => {
  }))
  map.set('username', null)
  map.set('isLoggedIn', false)
  map.set('loginMessage', null)
})

export const picked = (...picked) => Component => {
  const mapDispatchToProps = {}
  function mapStateToProps(store, props) {
  }
  return connectHelper({mapStateToProps, mapDispatchToProps})(function PermissionWrapper({props}) {
    return <Component {...props}/>
  })
}

export function reducer(state = defaultState, {type, actionType, modelType, itemOrItems, ...action}) {
  if (type !== 'user') {
    return state
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
