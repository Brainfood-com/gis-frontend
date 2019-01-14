import isEqual from 'lodash-es/isEqual'
import flow from 'lodash-es/flow'
import PropTypes from 'prop-types'
import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import {WithOutContext as ReactTags} from 'react-tag-input'
import {immutableEmptyList} from '../constants'
import {checkPermission, picked as userPicked} from '../User'

export const commonTagDefinitions = {
  CLAIMED: {roles: ['editor'], label: 'Claimed'},
  RANDOM_IMAGES: {roles: ['editor'], label: 'Random Images'},
  DISJOINT_SEQUENCE: {roles: ['editor'], label: 'Disjoint Sequence'},
  ROUTING_GLITCH: {roles: ['editor'], label: 'Routing Glitch'},
  NEEDS_REVIEW: {roles: ['editor'], label: 'Needs Review'},
  PLACED: {roles: ['editor'], label: 'Placed'},
  VALIDATED: {roles: ['editor'], label: 'Validated'},
  BROKEN_IMAGE: {roles: ['editor'], label: 'Broken Image'},
  CLIENT_APPROVED: {roles: ['client'], label: 'Client Approved'},
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

function applyTagMutation(props, state, tagOrAccessor, mutator) {
  const {modelName, name, onChange, value, permissions} = props
  const tags = [].concat(state.tags)
  const tag = typeof tagOrAccessor === 'function' ? tagOrAccessor(tags).id : tagOrAccessor
  const {suggestionLookup: {[tag]: {roles: wantedRoles = ['freeform']} = {}}} = state
  const isAllowed = wantedRoles.reduce((skip, role) => checkPermission(permissions, role, modelName, 'tags') ? true : skip, false)
  if (!isAllowed) {
    return
  }
  mutator(tags)
  onChange({currentTarget: {name, value: tags.map(tag => tag.id)}})
}


const tagSuggestionShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    label: PropTypes.string.isRequired,
    roles: PropTypes.arrayOf(PropTypes.string),
  })
])

function suggestionToShape(suggestion) {
  return typeof suggestion === 'string' ? {label: suggestion} : suggestion
}

class IIIFTagEditor extends React.Component {
  state = {filteredSuggestions: []}

  static propTypes = {
    name: PropTypes.string,
    suggestions: PropTypes.arrayOf(tagSuggestionShape),
    value: PropTypes.array,
    onChange: PropTypes.func,
    modelName: PropTypes.string.isRequired,
  }

  static defaultProps = {
    value: immutableEmptyList,
    suggestions: [],
    onChange(event) {},
  }

  static getDerivedStateFromProps(props, state) {
    const {value} = props
    if (value === undefined) {
      return {
        modelName: null,
        value: null,
        tags: null,
        suggestions: null,
        suggestionLookup: null,
        filteredSuggestions: [],
        permissions: null,
      }
    }
    const tags = value.sort().map(s => ({id: s, text: s}))
    const suggestions = [].concat(props.suggestions).map(suggestionToShape).sort((a, b) => {
      const {label: aLabel} = a
      const {label: bLabel} = b
      if (aLabel < bLabel) {
        return -1
      } else if (aLabel > bLabel) {
        return 1
      } else {
        return 0
      }
    })
    const {modelName, permissions} = props
    if (modelName === state.modelName && isEqual(tags, state.tags) && suggestions === state.suggestions && permissions === state.permissions) {
      return {}
    }
    const tagLookup = tags.reduce((accum, tag) => {accum[tag.id] = true; return accum}, {})
    const filteredSuggestions = suggestions.filter(suggestion => {
      const {label, roles} = suggestion
      if (tagLookup[label]) {
        return false
      }
      if (roles) {
        if (!roles.reduce((skip, role) => checkPermission(permissions, role, modelName, 'tags') ? true : skip, false)) {
          return false
        }
      }
      return true
    }).map(s => ({id: s.label, text: s.label}))
    return {
      modelName,
      value,
      suggestions,
      suggestionLookup: suggestions.reduce((result, suggestion) => {
        result[suggestion.label] = suggestion
        return result
      }, {}),
      tags,
      permissions,
      filteredSuggestions,
    }
  }

	handleDelete = index => {
    applyTagMutation(this.props, this.state, tags => tags[index], tags => {
      tags.splice(index, 1)
    })
  }

  handleAddition = tagObject => {
    applyTagMutation(this.props, this.state, tagObject.id, tags => {
      tags.push({id: tagObject.id, label: tagObject.id})
    })
  }

  handleDrag = (tagObject, oldPosition, newPosition) => {
    applyTagMutation(this.props, this.state, tagObject.id, tags => {
      tags.splice(oldPosition, 1)
      tags.splice(newPosition, 0, {id: tagObject.id, label: tagObject.id})
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

export default flow(userPicked('permissions'), withStyles(styles))(IIIFTagEditor)
