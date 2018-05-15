import React from 'react'

import L from 'leaflet'
import 'leaflet-polylinedecorator'

import { Path } from 'react-leaflet'

export default class LeafletPolylineDecorator extends Path {
  static Symbol = L.Symbol

  createLeafletElement({latlngs, patterns, ...props}) {
    return L.polylineDecorator(latlngs, this.getOptions({...props, patterns}))
  }

  updateLeafletElement(fromProps, toProps) {
    if (fromProps.latlngs !== toProps.latlngs) {
      this.leafletElement.setPaths(toProps.latlngs)
    }
    if (fromProps.patterns !== toProps.patterns) {
      this.leafletElement.setPatterns(toProps.patterns)
    }
  }
}
