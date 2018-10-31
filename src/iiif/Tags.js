import Immutable from 'immutable'
import memoize from 'lodash-es/memoize'
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

const stringArrayHelper = memoize(stringArray => stringArray.map(s => ({id: s, text: s})), stringArray => JSON.stringify([...stringArray].sort()))

const emptyList = new Immutable.List()

function applyTagMutation(props, mutator) {
  const {owner, updateOwner} = props
  const tags = [].concat(owner.get('tags', emptyList).toJS())
  mutator(tags)
  updateOwner(owner.get('id'), {tags})
}


class IIIFTagEditor extends React.Component {
  state = {filteredSuggestions: []}

  static propTypes = {
    name: PropTypes.string,
    suggestions: PropTypes.arrayOf(PropTypes.string),
    onUpdate: PropTypes.func,
    owner: PropTypes.object,
    updateOwner: PropTypes.func,
  }

  static defaultProps = {
    onUpdate(name, tags) {},
    suggestions: [],
    updateOwner(id, fields) {},
  }

  static getDerivedStateFromProps(props, state) {
    const {owner, suggestions} = props
    if (owner.get('id') === undefined) {
      return {tags: null, suggestions: null, filteredSuggestions: []}
    }
    const tags = owner.get('tags', emptyList)
    if (tags === state.tags && suggestions == state.suggestions) {
      return {}
    }
    const tagLookup = tags.toJS().reduce((accum, tag) => {accum[tag] = true; return accum}, {})
    const filteredSuggestions = props.suggestions.filter(suggestion => !tagLookup[suggestion])
    return {tags, suggestions, filteredSuggestions}
  }

	handleDelete = index => {
    applyTagMutation(this.props, tags => {
      tags.splice(index, 1)
    })
  }

  handleAddition = tagObject => {
    applyTagMutation(this.props, tags => {
      tags.push(tagObject.id)
    })
  }

  handleDrag = (tagObject, oldPosition, newPosition) => {
    applyTagMutation(this.props, tags => {
      tags.splice(oldPosition, 1)
      tags.splice(newPosition, 0, tagObject.id)
    })
  }

  render() {
    const {className, classes, name, owner, suggestions} = this.props
    const {filteredSuggestions} = this.state
    if (owner.get('id') === undefined) {
      return <div/>
    }
    const tags = owner.get('tags', new Immutable.List()).toJS()
    return <div>
      <Typography variant='subheading' color='textSecondary'>Tags</Typography>
      <ReactTags inline={false} className={className} classNames={classes} name={name} tags={stringArrayHelper(tags)} suggestions={stringArrayHelper(filteredSuggestions)} handleDelete={this.handleDelete} handleAddition={this.handleAddition} handleDrag={this.handleDrag} allowDeleteFromEmptyInput={false} minQueryLength={0} autofocus={false}/>
    </div>
  }
}

export default withStyles(styles)(IIIFTagEditor)
