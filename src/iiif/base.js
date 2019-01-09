import React from 'react'
import DebouncedForm from '../DebouncedForm'

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

  processFieldInput(name, value, checked) {
    const {constructor: {fieldInputProcessors}} = this
    const {[name]: inputProcessor = value => value} = fieldInputProcessors
    return inputProcessor(value, checked)
  }
}
