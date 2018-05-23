
const [full, protocol, hostBase, hostSuffix] = window.location.href.match(/(https?:\/\/)((?:.*\.)?gis(?:-app)?)(\.[^:\/]+(:\d+)?).*/)

export const makeUrl = (host, prefix) => `${protocol}${host}.${hostBase}${hostSuffix}/${prefix}`
