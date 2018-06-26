import ReIssueApiGeoServerLogin from './ReIssueApiGeoServerLogin'

function swap(a) {
  return [a[1], a[0]]
}

const defaultGeoJSONParamters = {
  service: 'WFS',
  version: '1.0.0',
  request: 'getFeature',
  //typeName: 'cite:bc_well_data_wgs',
  //maxFeatures: 3000,
  outputFormat: 'application/json',
}

export default class GeoServerUtil {
  constructor(props) {
    const {servers} = props
    this.servers = Object.keys(servers).reduce((result, serverName) => {
      result[serverName] = new ReIssueApiGeoServerLogin(servers[serverName])
      return result
    }, {})
  }

  async fetch({server, typeName, workspace, ...restParameters}) {
    const parameters = {
      ...defaultGeoJSONParamters,
      typeName,
      maxFeatures: 15000,
      ...restParameters,
    }

    const data = await this.servers[server].api(`${workspace}/ows`, {parameters}).then(data => data.json())

    let totalLength = 0
    const allSegments = []
    const allPoints = []
    const processSegment = (segmentDef) => {
      const segmentPoints = []
      let a = swap(segmentDef[0])
      segmentPoints.push(a)
      for (let i = 1; i < segmentDef.length; i++) {
        const b = swap(segmentDef[i])
        segmentPoints.push(b)
        const lineLength = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
        const segment = [a, b]
        segment.totalLength = totalLength
        segment.lineLength = lineLength
        allSegments.push(segment)
        totalLength += lineLength
        a = b
      }
      allPoints.push(segmentPoints)
    }
    for (const feature of data.features) {
      switch (feature.geometry.type) {
        case 'MultiLineString':
          for (const piece of feature.geometry.coordinates) {
            processSegment(piece)
          }
          break
        case 'LineString':
          processSegment(feature.geometry.coordinates)
          break
        case 'MultiPolygon':
        case 'Polygon':
          break
        default:
          throw new Error('foo')
      }
    }
    return {data, allSegments, allPoints, totalLength}
  }
}
