import Enum from 'es6-enum'
import {immutableEmptyMap} from './constants'

const ACTION = Enum(
  'incrBusy',
  'decrBusy',
)

const defaultState = immutableEmptyMap.withMutations(map => {
  map.set('busy', 0)
})

export function reducer(state = defaultState, {type, actionType, ...action}) {
  if (type === 'application') {
    switch (actionType) {
      case ACTION.incrBusy:
        state = state.set('busy', state.get('busy') + 1)
        break
      case ACTION.decrBusy:
        state = state.set('busy', state.get('busy') - 1)
        break
    }
  }
  return state
}

export const incrBusy = () => ({type: 'application', actionType: ACTION.incrBusy})
export const decrBusy = () => ({type: 'application', actionType: ACTION.decrBusy})
