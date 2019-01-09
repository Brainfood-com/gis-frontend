import debounce from 'lodash-es/debounce'
import React from 'react'

export default class DebouncedForm extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      curField: null,
      curValue: null,
      curChecked: null,
    }
  }

  debouncedInputChange = debounce(() => {
    this.setState((state, props) => {
      const {curField, curValue, curChecked} = state
      if (!curField) {
        return
      }
      this.flushInputChange(curField, curValue, curChecked)
      return {curField: null, curValue: null, curChecked: null}
    })
  }, 750)

  skipChangeParent = (name, value, checked) => {
  }

  skipChange = (name, value, checked) => {
  }

  handleInputChange = event => {
    const {name, value, checked} = event.currentTarget
    if (this.skipChangeParent(name, value, checked) || this.skipChange(name, value, checked)) {
      return
    }
    this.setState((state, props) => {
      if (state.curField !== name) {
        this.debouncedInputChange.flush()
      }
      this.debouncedInputChange()
      return {curField: name, curValue: value, curChecked: checked}
    })
  }

  getValue(model, name) {
    return model.get(name)
  }

  processFieldInput(name, value, checked) {
    return value
  }

  checkOverrideValueDefault(model, name, def) {
    if (this.state.curField === name) {
      return this.processFieldInput(name, this.state.curValue, this.state.curChecked)
    } else {
      const value = this.getValue(model, name)
      return value === null || value === undefined ? def : value
    }
  }

  componentWillUnmount() {
    this.debouncedInputChange.flush()
    this.setState((curState, props) => ({curField: null, curValue: null}))
  }
}
