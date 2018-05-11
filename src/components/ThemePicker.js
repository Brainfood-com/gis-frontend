import React from 'react'
import { connect } from 'react-redux'
import ListItemIcon from 'material-ui/List/ListItemIcon'
import ListItemText from 'material-ui/List/ListItemText'
import MenuItem from 'material-ui/Menu/MenuItem'
import ToggleRadioButtonChecked from '@material-ui/icons/RadioButtonChecked'
import ToggleRadioButtonUnchecked from '@material-ui/icons/RadioButtonUnchecked'
import {themes} from './theme'

const initialTheme = (function() {
  const {localStorage} = global
  let themeName
  if (localStorage) {
    themeName = localStorage.getItem('theme')
  }
  if (!themeName) {
    themeName = 'Dark'
  }
  return themeName
})()

export function themeReducer(state = initialTheme, {type, ...action}) {
  switch (type) {
    case 'theme:set':
      return action.themeName
  }
  return state
}

function setThemeNameAction(themeName) {
  return async function(dispatch) {
    const {localStorage} = global
    if (localStorage) {
      //localStorage.setItem('themeName', themeName)
    }
    dispatch({type: 'theme:set', themeName})
  }
}

export function getTheme(themeName = 'Dark') {
  return themes[themeName]
}

function mapStateToProps(state, ownProps) {
  return {
    themeName: state.theme,
  }
}

function mapDispatchToProps(dispatch, getState) {
  return {
    setThemeName: function(themeName) {
      dispatch(setThemeNameAction(themeName))
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(class ThemePicker extends React.Component {
  render() {
    const {themeName: currentThemeName} = this.props
    const themeKeys = Object.keys(themes)
    themeKeys.sort()

    return themeKeys.map((themeName, index) => {
      const checked = themeName === currentThemeName
      const icon = checked ? <ToggleRadioButtonChecked/> : <ToggleRadioButtonUnchecked/>
      return <MenuItem style={{fontFamily: `foo-${themeName}`}} key={index} value={themeName} onClick={() => this.props.setThemeName(themeName)}>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={themeName}/>
      </MenuItem>
    })
  }
})
