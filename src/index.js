import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { routerReducer, routerMiddleware, push } from 'react-router-redux'
import createHistory from 'history/createBrowserHistory'
import thunk from 'redux-thunk'
import HTML5Backend from 'react-dnd-html5-backend'
import {DragDropContext} from 'react-dnd'

import ThemeConfig from './config/theming'
import GISDragLayer from './GISDragLayer'
import {reducer as iiifReducer, startOfDay as iiifStartOfDay} from './iiif/redux'
import {reducer as itemPanelReducer} from './ItemPanel'
import {reducer as applicationReducer} from './application-redux'
import { reducer as gisSearchReducer, startOfDay as searchStartOfDay } from './GISSearch'
import * as apiRedux from './api/redux'
import {GlobalBusy} from './GlobalBusy'
import history from './history'

import App from './App'

const middleware = routerMiddleware(history)
const enhancer = compose(
  applyMiddleware(middleware, thunk),
  //DevTools.instrument()
)
export const store = createStore(
  combineReducers({
    application: applicationReducer,
    router: routerReducer,
    iiif: iiifReducer,
    panel: itemPanelReducer,
    geoserver: apiRedux.reducer,
    search: gisSearchReducer,
  }),
  enhancer
)

store.dispatch(iiifStartOfDay())
store.dispatch(searchStartOfDay())
store.dispatch(apiRedux.setTypeName('gis:tl_2017_06037_edges'))
store.dispatch(apiRedux.setDistance(1500))

import { Provider, connect } from 'react-redux'
import { Router } from 'react-router'

const Root = DragDropContext(HTML5Backend)(props => {
  return <React.Fragment>
    <Provider store={store}>
      <ThemeConfig>
        <GlobalBusy>
          <Router history={history}>
            <App/>
          </Router>
        </GlobalBusy>
      </ThemeConfig>
    </Provider>
    <GISDragLayer/>
  </React.Fragment>
})

ReactDOM.render(
    <div>
        <Root/>
    </div>,
    document.getElementById('player')
);

