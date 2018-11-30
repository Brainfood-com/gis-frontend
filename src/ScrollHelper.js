export function createScrollHandler(onScrollNext) {
  return function handleScroll(event) {
    const {deltaX, deltaY, deltaZ, deltaMode} = event
    const delta = deltaX === 0 ? deltaY : deltaX
    if (delta === 0) {
      return
    }
    event.preventDefault()
    onScrollNext(Math.sign(delta))
  }
}

