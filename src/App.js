import React from 'react'

import Home from './Home'
import IiifRouter from './iiif/Router'

import { Route } from 'react-router'

export default class App extends React.Component {
  render() {
    return <React.Fragment>
      <Route exact path="/" component={Home}/>
      <Route path="/iiif" component={IiifRouter}/>
    </React.Fragment>
  }
}
