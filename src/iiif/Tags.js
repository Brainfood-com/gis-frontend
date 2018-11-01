import Immutable from 'immutable'
import PropTypes from 'prop-types'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import {WithOutContext as ReactTags} from 'react-tag-input'

export const commonTagDefinitions = {
  CLAIMED: 'Claimed',
  RANDOM_IMAGES: 'Random Images',
  DISJOINT_SEQUENCE: 'Disjoint Sequence',
  ROUTING_GLITCH: 'Routing Glitch',
  NEEDS_REVIEW: 'Needs Review',
  PLACED: 'Placed',
  VALIDATED: 'Validated',
  BROKEN_IMAGE: 'Broken Image',
}

const styles = theme => {
  return {
    tags: {},
    tagInput: {},
    tagInputField: {},
    selected: {
      display: 'flex',
      flexWrap: 'wrap',
      flexDirection: 'row',
      alignItems: 'baseline',
      margin: [0, -theme.spacing.unit / 2, 0, -theme.spacing.unit / 2],
      //justifyContent: 'space-around',
    },
    tag: {
      border:'1px solid black',
      background: 'white',
      color: 'black',
      borderRadius: theme.spacing.unit * 2,
      margin: theme.spacing.unit / 2,
      padding: [theme.spacing.unit / 2, theme.spacing.unit],
    },
    remove: {},
    suggestions: {
      '& > ul': {
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        alignItems: 'baseline',
      },
      '& > ul > li': {
        borderRadius: theme.spacing.unit * 2,
        border: '1px solid black',
        padding: theme.spacing.unit,
        margin: 0,
        background: 'white',
        color: 'black',
        '&$activeSuggestion': {
          borderColor: 'white',
          background: 'black',
          color: 'white',
        },
      },
    },
    activeSuggestion: {},
  }
}


const emptyList = new Immutable.List()

function applyTagMutation(props, mutator) {
  const {name, onChange, value} = props
  const newValue = mutator(value)
  onChange({currentTarget: {name, value: newValue}})
}


class IIIFTagEditor extends React.Component {
  state = {filteredSuggestions: []}

  static propTypes = {
    name: PropTypes.string,
    suggestions: PropTypes.arrayOf(PropTypes.string),
    value: PropTypes.instanceOf(Immutable.List),
    onChange: PropTypes.func,
  }

  static defaultProps = {
    value: emptyList,
    suggestions: [],
    onChange(event) {},
  }

  static getDerivedStateFromProps(props, state) {
    const {value} = props
    if (value === undefined) {
      return {value: null, tags: null, suggestions: null, filteredSuggestions: []}
    }
    const tags = value.toJS().sort().map(s => ({id: s, text: s}))
    const suggestions = [].concat(props.suggestions).sort()
    if (tags === state.tags && suggestions == state.suggestions) {
      return {}
    }
    const tagLookup = tags.reduce((accum, tag) => {accum[tag.id] = true; return accum}, {})
    const filteredSuggestions = suggestions.filter(suggestion => !tagLookup[suggestion]).map(s => ({id: s, text: s}))
    return {
      value,
      suggestions,
      tags,
      filteredSuggestions,
    }
  }

	handleDelete = index => {
    applyTagMutation(this.props, tags => {
      return tags.delete(index)
    })
  }

  handleAddition = tagObject => {
    applyTagMutation(this.props, tags => {
      return tags.push(tagObject.id)
    })
  }

  handleDrag = (tagObject, oldPosition, newPosition) => {
    applyTagMutation(this.props, tags => {
      return tags.delete(oldPosition).insert(newPosition, tagObject.id)
    })
  }

  render() {
    const {className, classes, name, suggestions, value} = this.props
    const {tags, filteredSuggestions} = this.state
    if (value === undefined) {
      return <div/>
    }
    return <div>
      <Typography variant='subheading' color='textSecondary'>Tags</Typography>
      <ReactTags inline={false} className={className} classNames={classes} name={name} tags={tags} suggestions={filteredSuggestions} handleDelete={this.handleDelete} handleAddition={this.handleAddition} handleDrag={this.handleDrag} allowDeleteFromEmptyInput={false} minQueryLength={0} autofocus={false}/>
    </div>
  }
}

export default withStyles(styles)(IIIFTagEditor)
