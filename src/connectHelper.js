import { connect } from 'react-redux'

export default args => {
  const {mapStateToProps, mapDispatchToProps, mergeProps, options} = args
  return connect(mapStateToProps, mapDispatchToProps, mergeProps, options)
}


