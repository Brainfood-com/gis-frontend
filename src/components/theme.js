import {lighten, fade} from '@material-ui/core/styles/colorManipulator'
import createMuiTheme from '@material-ui/core/styles/createMuiTheme'
//import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
//import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme'
import merge from 'lodash/merge'
import grey from '@material-ui/core/colors/grey'
import green from '@material-ui/core/colors/green'

import {styles as tabStyles} from '@material-ui/core/Tab'

//const colors = require('material-ui/styles/colors');
import spacing from '@material-ui/core/styles/spacing'

export function getMuiTheme(themeRO) {
  let muiTheme = createMuiTheme(themeRO)
  const {colors: shuttleColors, gis} = themeRO
  const {palette, typography, spacing} = muiTheme
  merge(muiTheme, {
    relider: {
      handleColorZero: palette.primary.light,      // done
      handleFillColor: palette.secondary.dark,      // done
      handleSize: spacing.unit * 1.5,           // done
      handleSizeDisabled: spacing.unit,   // done
      handleSizeActive: spacing.unit * 2,     // done
      trackSize: spacing.unit / 4,            // done
      trackColor: palette.primary.light,           // done
      trackColorSelected: palette.secondary.light,   // done
      rippleColor: palette.primary.main,
      selectionColor: palette.primary.main,       // done
      handleBorderWidth: 0,
      handleBorderColor: 'transparent',
    },
    overrides: {
      FieldValidation: {
        wrapper: {
          //border: '1px solid red',
          borderRadius: spacing.unit,
          padding: 5,
          margin: 5,
          background: palette.primary.contrastText,
        },
        controlInput: {
          background: palette.type === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
  })
  console.log('muiTheme', muiTheme)
  return muiTheme
}

const themeDefaults = {
}

export const Dark = merge({}, themeDefaults, {
  fontFamily: 'sans-serif',
  palette: {
    type: 'dark',
  },
})

export const Light = merge({}, themeDefaults, {
  fontFamily: 'serif',
  palette: {
    type: 'light',
  },
})

export const themes = {
  Light,
  Dark,
}
