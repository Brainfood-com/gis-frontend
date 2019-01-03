import connectHelper from '../connectHelper'
import {makeUrl} from '../api'

import {ACTION, MODEL} from './redux'

export const getStats = type => async dispatch => {
  const statsDetail = await fetch(makeUrl('api', `stats/${type}`), {method: 'POST'}).then(data => data.json())
  dispatch({type: 'redux-iiif', actionType: ACTION.set, modelType: MODEL['stats'], itemOrItems: {id: type, ...statsDetail}})
}

export const stats = (...picked) => Component => {
  function mapStateToProps(store, props) {
    const {iiif} = store
    return picked.reduce((result, type) => {
      result[type] = iiif.getIn([MODEL['stats'], type])
      return result
    }, {})
  }
  return connectHelper({mapStateToProps})(Component)
}
