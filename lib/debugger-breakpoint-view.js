'use babel'

/* @flow */

import DebuggerPanelSection from './debugger-panel-section'

export default class DebuggerBreakpointView {
  element: DebuggerPanelSection;

  constructor() {

    this.element = new DebuggerPanelSection
    this.element.innerHTML = 'DebuggerBreakpointView'
  }

  getElement(): DebuggerPanelSection {
    return this.element
  }
}
