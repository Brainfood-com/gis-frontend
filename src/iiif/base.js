import React from 'react'
import {immutableEmptyMap} from '../constants'
import DebouncedForm from '../DebouncedForm'
import { checkPermission } from '../User'

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
    if (name.startsWith('values.')) {
      return model.getIn(['values',name.substring('values.'.length)])
    } else {
      return model.get(name)
    }
  }

  flushInputChange = (name, value, checked) => {
    const {constructor: {updaterName}} = this
    const {[updaterName]: updater} = this.props
    const processedValue = this.processFieldInput(name, value, checked)
    const currentValue = this.getValue(name)
    if (currentValue !== processedValue) {
      if (name.startsWith('values.')) {
        const values = this.getValue('values', immutableEmptyMap).set(name.substring('values.'.length), processedValue)
        updater(this.getValue('id'), {values})
      } else {
        updater(this.getValue('id'), {[name]: processedValue})
      }
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
    return !this.checkPermission(modelName, name)
  }

  requiredRole() {
    return 'editor'
  }

  checkPermission(modelName, name) {
    const {permissions} = this.props
    return checkPermission(permissions, this.requiredRole(), modelName, name)
  }
}
