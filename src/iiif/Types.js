import ImmutablePropTypes from 'react-immutable-proptypes'
import PropTypes from 'prop-types'

// support
export const isRequiredWhenOther = (propType, ...others) => (props, propName, componentName, ...rest) => {
  const chainedPropType = others.reduce((result, other) => props[other] === undefined ? false : result, true) ? propType.isRequired : propType
  return chainedPropType(props, propName, componentName, ...rest)
}

// Tags
export const TagsShape = ImmutablePropTypes.listOf(PropTypes.string)
export const TagSuggestionShape = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    label: PropTypes.string.isRequired,
    roles: PropTypes.arrayOf(PropTypes.string),
  })
])

// Collection
export const CollectionStatusShape = ImmutablePropTypes.mapContains({
  busy: PropTypes.number.isRequired,
  exists: PropTypes.bool.isRequired,
})
export const CollectionShape = ImmutablePropTypes.mapContains({
  id: PropTypes.number.isRequired,
  label: PropTypes.string,
  notes: PropTypes.string,
  tags: TagsShape,
  values: ImmutablePropTypes.mapContains({
    bftags: ImmutablePropTypes.listOf(PropTypes.string),
  }),
})

export const CollectionsShape = ImmutablePropTypes.mapOf(CollectionShape.isRequired, PropTypes.number.isRequired)

// Manifest
export const ManifestStatusShape = ImmutablePropTypes.mapContains({
  busy: PropTypes.number.isRequired,
  exists: PropTypes.bool.isRequired,
})
export const ManifestShape = ImmutablePropTypes.mapContains({
  id: PropTypes.number.isRequired,
  label: PropTypes.string,
  notes: PropTypes.string,
  tags: TagsShape,
  values: ImmutablePropTypes.mapContains({
    year: PropTypes.number,
    batch: PropTypes.string,
    bftags: ImmutablePropTypes.listOf(PropTypes.string),
  }),
})
export const ManifestsShape = ImmutablePropTypes.mapOf(ManifestShape.isRequired, PropTypes.number.isRequired)

// Range
export const RangeStatusShape = ImmutablePropTypes.mapContains({
  busy: PropTypes.number.isRequired,
  exists: PropTypes.bool.isRequired,
})
export const RangeShape = ImmutablePropTypes.mapContains({
  id: PropTypes.number.isRequired,
  label: PropTypes.string,
  notes: PropTypes.string,
  tags: TagsShape,
  values: ImmutablePropTypes.mapContains({
    bftags: ImmutablePropTypes.listOf(PropTypes.string),
  }),
  reverse: PropTypes.bool,
  fovOrientation: PropTypes.oneOf(['left', 'right']),
  fovAngle: PropTypes.number,
  fovDepth: PropTypes.number,
})
export const RangesShape = ImmutablePropTypes.mapOf(
  RangeShape,
  PropTypes.number
)

// Canvas
export const CanvasStatusShape = ImmutablePropTypes.mapContains({
  busy: PropTypes.number.isRequired,
  exists: PropTypes.bool.isRequired,
})
export const CanvasShape = ImmutablePropTypes.mapContains({
  id: PropTypes.number.isRequired,
  label: PropTypes.string,
  notes: PropTypes.string,
  tags: TagsShape,
  exclude: PropTypes.bool,
  hole: PropTypes.bool,
  override: PropTypes.bool,
})
export const CanvasesShape = ImmutablePropTypes.mapOf(
  CanvasShape,
  PropTypes.number
)


