export default class ReIssueApi {
  init() {
    return (this._init || (this._init = this.createInitializer()))
  }

  async createInitializer() {
    return true
  }

  async isValid(response) {
    const isValid = await this.checkResponse(response)
    if (!isValid) {
      delete this._init
    }
    return isValid
  }

  async checkResponse(response) {
    return true
  }

  async api(url, options) {
    const initPhaseOne = await this.init()
    const fetchPhaseOne = await fetch(url, options)
    const isValid = await this.isValid(fetchPhaseOne)
    if (!isValid) {
      await this.init()
      return await fetch(url, options)
    }
    return fetchPhaseOne
  }
}

