import React from 'react'

import Home from './Home'

import { Route } from 'react-router'

export default class App extends React.Component {
  render() {
    return <React.Fragment>
      <Route exact path="/" component={Home}/>
    </React.Fragment>
  }
}
