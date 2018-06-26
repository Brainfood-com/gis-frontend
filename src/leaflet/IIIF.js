import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'

import L from 'leaflet'
import 'leaflet-draw'
import 'leaflet-iiif'
import { Map, TileLayer } from 'react-leaflet'
import $ from 'jquery'

window.$ = $

const fixedScrollMapStyles = {
  root: {
    position: 'relative',
  },
	map: {
    position: 'absolute',
    width: '100%',
    height: '100%',
	},
}

// leaflet uses up/down wheel for it's own purposes, but then swallows
// all other variants; this class wraps the real Map object with a div,
// and a separate outer wheel handler, and forwards on wheel events 
// only when it's the correct direction.
export const FixedScrollMap = withStyles(fixedScrollMapStyles)(class FixedScrollMap extends React.Component {
  static defaultProps = {
    onWheel(event) {},
  }

  constructor(props) {
    super(props)
    this.mapRef = React.createRef()
  }

  handleOnWheel = event => {
    const {deltaX} = event
    if (deltaX === 0) {
      this.scrollWheelZoom._onWheelScroll(event)
    } else {
      const {onWheel} = this.props
      onWheel(event)
    }
  }

  componentDidMount() {
    this.scrollWheelZoom = new L.Map.ScrollWheelZoom(this.mapRef.current.leafletElement)
  }

  render() {
    const {classes, className, children, onWheel, ...props} = this.props
    return <div className={classnames(classes.root, className)} onWheel={this.handleOnWheel}>
      <Map className={classes.map} {...props} scrollWheelZoom={false} ref={this.mapRef}>{children}</Map>
    </div>
  }
})

// Fix several race conditions in leaflet-iiif
const FixedIiif = L.TileLayer.Iiif.extend({
  onAdd: function(map) {
    // This fixes the case when the layer has been removed before the
    // remote server has given us the IIIF info.
    $.when(this._infoDeferred).done(() => {
      if (this._map) {
        L.TileLayer.Iiif.prototype.onAdd.call(this, map)
      }
    })
  },

  onRemove: function(map) {
    // This bug happens when the server has returned info, and we've started processing, but
    // no tiles have been rendered yet.
    if (this._container) {
      L.TileLayer.Iiif.prototype.onRemove.call(this, map)
    }
  },
})

// Convert leaflet-iiif to react-leaflet
class IIIFTileLayerImpl extends TileLayer {
  createLeafletElement(props: Props): LeafletElement {
    return new FixedIiif(props.url, this.getOptions(props))
  }
}

// leaflet-iiif doesn't handle url updates correctly, so we make use
// of react's key property to cause react to recreate the entire
// element.
export class IIIFTileLayer extends React.Component {
  static propTypes = {
    url: PropTypes.string.required,
  }

  render() {
    const {url, ...props} = this.props
    return <IIIFTileLayerImpl key={url} {...props} url={url}/>
  }
}

const styles = {
  root: {
  },
  loading: {
    '& $map': {
    }
  },
  map: {},
  tileLoading: {
    backgroundColor:'green',
    margin:-1,
    border:'1px solid red',
    opacity: [1, '!important'],
    visibility: 'visibile',
    width: [256, '!important'],
    height: [256, '!important'],
  },
}

export default withStyles(styles)(class IIIFViewer extends React.Component {
  static propTypes = {
    url: PropTypes.string.required,
  }

  constructor(props) {
    super(props)
    console.log('new IIIFViewer')
    this.state = {center: [0, 0], zoom: 1, tileLoadCount: 0}
  }

  handleOnViewportChange = ({center, zoom}) => {
    this.setState({center, zoom})
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.url !== nextProps.url) {
      this.setState({tileLoadCount: 0})
    }
  }

  handleOnTileLoadStart = event => {
    const {tileLoadCount} = this.state
    this.setState({tileLoadCount: tileLoadCount + 1})
    const {tile} = event
    const {classes} = this.props
    $(event.tile).addClass(classes.tileLoading)
  }

  handleOnTileLoadError = event => {
    const {tileLoadCount} = this.state
    this.setState({tileLoadCount: tileLoadCount - 1})
    const {classes} = this.props
    $(event.tile).removeClass(classes.tileLoading)
  }

  handleOnTileLoad = event => {
    const {tileLoadCount} = this.state
    this.setState({tileLoadCount: tileLoadCount - 1})
    const {tile} = event
    const {naturalHeight: height, naturalWidth: width, style} = tile
    if (height && style.height === '0px') {
      style.height = height + 'px'
    }
    if (width && style.width === '0px') {
      style.width = width + 'px'
    }
    const {classes} = this.props
    $(event.tile).removeClass(classes.tileLoading)
  }

  render() {
    const {className, classes, url, onWheel} = this.props
    const {center, zoom, tileLoadCount} = this.state
    console.log('IIIFViewer:render', url, center, zoom, tileLoadCount)
    const wantedClasses = {
      [classes.root]: true,
      [classes.loading]: tileLoadCount > 0,
    }
    return <FixedScrollMap className={classnames(wantedClasses, className)} classes={{map: classes.map}} center={center} zoom={zoom} crs={L.CRS.Simple} onWheel={onWheel} onViewportChange={this.handleOnViewportChange}>
      <IIIFTileLayer onTileloadstart={this.handleOnTileLoadStart} onTileerror={this.handleOnTileError} onTileLoad={this.handleOnTileLoad} url={url} tileSize={256} fitBounds={true} setMaxBounds={true} onWheel={onWheel}/>
    </FixedScrollMap>
  }
})
