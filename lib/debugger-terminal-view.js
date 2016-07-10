'use babel'

/* @flow */

import DebuggerPanelSection from './debugger-panel-section'

export default class DebuggerTerminalView {
  element: DebuggerPanelSection;

  constructor() {

    this.element = new DebuggerPanelSection
    this.element.innerHTML = 'DebuggerTerminalView'
  }

  getElement(): DebuggerPanelSection {
    return this.element
  }
}
