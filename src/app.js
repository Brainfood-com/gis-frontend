import React from 'react'
import ReactDOM from 'react-dom'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { routerReducer, routerMiddleware, push } from 'react-router-redux'
import createHistory from 'history/createBrowserHistory'
import thunk from 'redux-thunk'
import HTML5Backend from 'react-dnd-html5-backend'
import {DragDropContext, DropTarget} from 'react-dnd'

import ThemeConfig from './config/theming'
import GISControl from './GISControl'
import GISDragLayer from './GISDragLayer'
import Page from './Page'
import {reducer as iiifReducer, startOfDay as iiifStartOfDay} from './iiif/redux'
import {reducer as itemPanelReducer} from './ItemPanel'
import {reducer as applicationReducer} from './application-redux'
import * as apiRedux from './api/redux'
import {CanvasCard} from './iiif/Canvas'
import {GlobalBusy} from './GlobalBusy'

const history = createHistory()
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
        <GlobalBusy>
				  <Router history={this.props.history}>
							<Route exact path="/" component={Home} />
  				</Router>
        </GlobalBusy>
      </ThemeConfig>
		</Provider>
  }

}

const Root = DragDropContext(HTML5Backend)(DropTarget([CanvasCard.TYPE], {}, () => ({}))(props => {
  return <div>
    <App history={history} store={store} />
    <GISDragLayer/>
  </div>
}))

ReactDOM.render(
    <div>
        <Root/>
    </div>,
    document.getElementById('player')
);

