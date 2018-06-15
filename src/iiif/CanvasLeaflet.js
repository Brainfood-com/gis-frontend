import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import $ from 'jquery'

const canvasLeafletStyles = {
}

const CanvasLeaflet = withStyles(canvasLeafletStyles)(class CanvasLeaflet extends React.Component {
	componentDidMount() {
    window.$ = $
    const self = this

    // Lazy load leaflet after we have a DOM
    const L = this.L = require('leaflet')
    require('leaflet-iiif')
    require('leaflet/dist/leaflet.css')
    require('leaflet-draw')

    const map = this.map = L.map('bfpleaflet', {
      center: [0, 0],
      crs: L.CRS.Simple,
      zoom: 1
    })

    const iiif = this.iiif = L.tileLayer.iiif(this.props.url, {
      tileSize: 256,
      fitBounds: true,
      setMaxBounds: true
    })
    iiif.addTo(this.map)
	}

  componentWillUnmount() {
    this.map.remove()
  }

  render() {
    return <div id="bfpleaflet" style={{width: '100%', height: '100%'}}></div>
  }
})

export default CanvasLeaflet
