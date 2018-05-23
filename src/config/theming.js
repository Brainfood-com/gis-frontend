import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import {create as jssCreate} from 'jss'
import jssExpand from 'jss-expand'
import jssCompose from 'jss-compose'
import CssBaseline from '@material-ui/core/CssBaseline/CssBaseline'
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider'
import createGenerateClassName from '@material-ui/core/styles/createGenerateClassName'
import jssPreset from '@material-ui/core/styles/jssPreset'
import {JssProvider, ThemeProvider} from 'react-jss'

import {getMuiTheme}  from '../components/theme'
import {getTheme} from '../components/ThemePicker'

const generateClassName = createGenerateClassName({dangerouslyUseGlobalCSS: false})
const jss = jssCreate({
  plugins: [
    ...jssPreset().plugins,
    jssExpand(),
    jssCompose(),
  ],
})

function processProps(props, prevState = {}) {
  const {themeName} = props
  const mergeState = {}

  if (themeName !== prevState.themeName) {
    mergeState.themeName = themeName
    const theme = getMuiTheme(getTheme(themeName))
    mergeState.theme = theme
  }
  return mergeState
}

class ThemeConfig extends React.Component {
  static propTypes = {
    themeName: PropTypes.string,
  }
  static defaultProps = {
    themeName: 'Dark',
  }

  constructor(props) {
    super(props)
    this.state = processProps(props)
  }

  componentWillReceiveProps(nextProps) {
    this.setState(processProps(nextProps, this.state))
  }

  render() {
    const {children} = this.props
    const {theme} = this.state
    return <JssProvider jss={jss} generateClassName={generateClassName}>
      <MuiThemeProvider theme={theme}>
        <ThemeProvider theme={theme}>
          <React.Fragment>
            <CssBaseline/>
            {children}
          </React.Fragment>
        </ThemeProvider>
      </MuiThemeProvider>
    </JssProvider>
  }
}

const mapStateToProps = state => {
  return {
    themeName: state.theme,
  }
}

export default connect(mapStateToProps, null)(ThemeConfig)

