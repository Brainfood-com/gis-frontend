import React from 'react'

import {Marker} from 'react-leaflet'

export default class RotatableMarker  extends Marker {
  updateLeafletElement(fromProps, toProps) {
    super.updateLeafletElement(fromProps, toProps)
    if (toProps.rotationAngle !== fromProps.rotationAngle) {
      this.leafletElement.setRotationAngle(toProps.rotationAngle)
    }
  }
}
