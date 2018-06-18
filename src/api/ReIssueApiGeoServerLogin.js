import ReIssueApi from './ReIssueApi'

export default class ReIssueApiGeoServerLogin extends ReIssueApi {
  constructor(serverDef) {
    super()
    this.serverDef = serverDef
  }

  async createInitializer() {
    const {serverDef} = this
    const form = new URLSearchParams()
    form.set('username', serverDef.username)
    form.set('password', serverDef.password)
    await fetch(`${serverDef.url}/web`, {credentials: 'include', method: 'GET', mode: 'no-cors'})
    return fetch(`${serverDef.url}/j_spring_security_check`, {credentials: 'include', method: 'POST', mode: 'no-cors', body: form})
  }

  async checkResponse(response) {
    const contentType = response.headers.get('Content-Type')
    console.log('contentType', contentType)
    return true
  }

  api(urlSuffix, {credentials = 'include', datatype = 'json', parameters = {}, ...options} = {}) {
    const {serverDef} = this
    const url = new URL(`${serverDef.url}/${urlSuffix}`)
    url.search = new URLSearchParams(parameters)
    return super.api(url, {...options, credentials, datatype})
  }
}
