import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { routerReducer, routerMiddleware, push } from 'react-router-redux'
import createHistory from 'history/createBrowserHistory'
import thunk from 'redux-thunk'

import ThemeConfig from './config/theming'
import GISControl from './GISControl'
import Page from './Page'
import {reducer as iiifReducer, startOfDay as iiifStartOfDay} from './iiif/redux'
import {reducer as itemPanelReducer} from './ItemPanel'
import * as apiRedux from './api/redux'

const history = createHistory()
const middleware = routerMiddleware(history)
const enhancer = compose(
  applyMiddleware(middleware, thunk),
  //DevTools.instrument()
)
export const store = createStore(
	combineReducers({
		router: routerReducer,
    iiif: iiifReducer,
    panel: itemPanelReducer,
    geoserver: apiRedux.reducer,
	}),
	enhancer
)

store.dispatch(iiifStartOfDay())
store.dispatch(apiRedux.setTypeName('gis:tl_2017_06037_edges'))
store.dispatch(apiRedux.setDistance(1500))

import { Provider, connect } from 'react-redux'
import { Router, Route } from 'react-router'
  
class Home extends React.Component {
  render() {
    return <Page>
      <GISControl/>
    </Page>
  }
}

class App extends React.Component {
  componentDidMount() {
    //this.props.restoreLocalSession()
  }

  render() {
    console.log('props', this.props)
    return <Provider store={this.props.store}>
      <ThemeConfig>
				<Router history={this.props.history}>
							<Route exact path="/" component={Home} />
				</Router>
      </ThemeConfig>
		</Provider>
  }

}

ReactDOM.render(
    <div>
        <App history={history} store={store} />
    </div>,
    document.getElementById('player')
);

