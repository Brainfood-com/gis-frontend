import React from 'react'

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


