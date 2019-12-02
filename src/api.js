
const [full, protocol, hostBase, hostSuffix] = window.location.href.match(/(https?:\/\/)(?:www\.)?((?:.*\.)?gis(?:-app)?)(\.[^:\/]+(:\d+)?).*/)

export const makeUrl = (host, prefix) => `${protocol}${host}.${hostBase}${hostSuffix}/${prefix}`
export const safeGetImmutableId = item => item ? item.get('id') : null
