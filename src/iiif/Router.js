import isEquals from 'lodash-es/isEqual'
import React from 'react'
import queryString from 'query-string'

import connectHelper from '../connectHelper'
import * as iiifRedux from './redux'

import Home from '../Home'

const mapDispatchToProps = {
  detectAndPick(search) {
    return (dispatch, getState) => {
      dispatch(iiifRedux.detectAndPick(search))
    }
  },
}

function mapStateToProps(store, props) {
  return {}
}

export default connectHelper({mapStateToProps, mapDispatchToProps})(class Router extends React.Component {
  componentDidMount(props, state) {
    const {match, location, detectAndPick} = this.props
    detectAndPick(queryString.parse(location.search))
  }

  componentDidUpdate(prevProps, prevState) {
    const {match, location, detectAndPick} = this.props
    if (!isEquals(location, prevProps.location)) {
      //detectAndPick(queryString.parse(location.search))
    }
  }

  render() {
    const {match} = this.props
    return <Home/>
  }
})
