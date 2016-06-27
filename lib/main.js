'use babel'

/* @flow */

import DebuggerView from './debugger-view'

module.exports = {

  view: DebuggerView,

  activate(): void {
    this.view = new DebuggerView
  },

  deactivate(): void {
    this.view.dispose()
  },

  provideView(): DebuggerView {
    return this.view
  }
}
