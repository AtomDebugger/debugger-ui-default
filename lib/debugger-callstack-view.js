'use babel'

/* @flow */

import DebuggerPanelSection from './debugger-panel-section'

export default class DebuggerCallstackView {
  element: DebuggerPanelSection;

  constructor() {

    this.element = new DebuggerPanelSection
    this.element.innerHTML = 'DebuggerCallstackView'
  }

  getElement(): DebuggerPanelSection {
    return this.element
  }
}
