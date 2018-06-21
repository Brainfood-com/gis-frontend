export default class Points {
  static degreesToRadians = Math.PI / 180

  constructor(points) {
    this.points = points
  }

  reducer(handler) {
    function mapArray(array) {
      return array.map(item => Array.isArray(item) ? mapArray(item) : item instanceof Points ? mapArray(item.points) : handler(item))
    }

    return new Points(mapArray(this.points))
  }
  
  rotate(degrees, center = {x: 0, y: 0}) {
    const angle = degrees * Points.degreesToRadians
    const sinAngle = Math.sin(angle)
    const cosAngle = Math.cos(angle)
    const {x: cx, y: cy} = center

    return this.reducer(point => {
      const p2 = {x: point.x - cx, y: point.y - cy}
      // rotate using matrix rotation
      const p3 = {x: cosAngle * p2.x - sinAngle * p2.y, y: sinAngle * p2.x + cosAngle * p2.y}
      // translate back to center
      return {x: p3.x + cx, y: p3.y + cy}
    })
  }

  scale(ratio) {
    return this.reducer(({x, y}) => ({x: x * ratio, y: y * ratio}))
  }
  
  center(center) {
    return this.reducer(({x, y}) => ({x: x + center.x, y: y + center.y}))
  }

  unproject(map) {
    return this.reducer(point => map.unproject(point))
  }
}

