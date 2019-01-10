import React from 'react'
import DebouncedForm from '../DebouncedForm'
import { checkPermissions } from '../User'

export class AbstractDetail extends React.Component {
  static defaultProps = {
    onItemPicked(type, item) {},
  }

  componentDidMount() {
    const {item, onItemPicked} = this.props
    onItemPicked(this._type, item)
  }

  componentWillReceiveProps(nextProps) {
    const {item, onItemPicked} = nextProps
    if (item !== this.props.item || onItemPicked !== this.props.onItemPicked) {
      onItemPicked(this._type, item)
    }
  }
}

export class AbstractForm extends DebouncedForm {
  getValue(name) {
    const {constructor: {modelName}} = this
    const {props: {[modelName]: model}} = this
    return model[name]
  }

  flushInputChange = (name, value, checked) => {
    const {constructor: {updaterName}} = this
    const {[updaterName]: updater} = this.props
    const processedValue = this.processFieldInput(name, value, checked)
    const currentValue = this.getValue(name)
    if (currentValue !== processedValue) {
      updater(this.getValue('id'), {[name]: processedValue})
    }
  }

  processFieldInput(name, value, checked) {
    const {constructor: {fieldInputProcessors}} = this
    const {[name]: inputProcessor = value => value} = fieldInputProcessors
    return inputProcessor(value, checked)
  }

  skipChangeItem = (name, value, checked) => {
    const {constructor: {complexFields = [], modelName}} = this
    if (complexFields.indexOf(name) !== -1) {
      return false
    }
    const {permissions} = this.props
    return !checkPermissions(permissions, this.requiredRole(), modelName, name)
  }

  requiredRole() {
    return 'editor'
  }
}
