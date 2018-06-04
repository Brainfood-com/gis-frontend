import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import classnames from 'classnames'

const styles = {
  root: {
  },
  cell: {
		width: '33.33333%',
    display: 'inline-block',
  },
  cellContent: {
    display: 'inline-block',
		width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  childChildContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
	},

	ratioDefault: {
		height: '100%',
  },
  ratio16x9: {
    paddingTop: '56.25%',
  },
  ratio4x3: {
    paddingTop: '75%',
  },
}

export default withStyles(styles)(class GISGrid extends React.Component {

	render() {
    const {className, classes, children} = this.props

    return <div className={classnames(classes.root, className)}>
      {React.Children.map(children, (child, index) => {
        const cellClasses = {
          [classes.cell]: true,
        }
        const cellContentClasses = {
          [classes.cellContent]: true,
          [classes.ratio16x9]: true,
        }
        const cellChildClasses = {
          [classes.childChildContent]: true,
        }

        return <div key={index} className={classnames(cellClasses)}>
          <div className={classnames(cellContentClasses)}>
            <div className={classnames(cellChildClasses)}>{React.cloneElement(child)}</div>
          </div>
        </div>
      })}
    </div>
  }
})
