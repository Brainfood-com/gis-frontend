import React from 'react'

import GISControl from './GISControl'
import Page from './Page'

export default class Home extends React.Component {
  render() {
    return <Page>
      <GISControl/>
    </Page>
  }
}
