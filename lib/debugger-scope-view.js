'use babel'

/* @flow */
import DebuggerPanelSection from './debugger-panel-section'

export default class DebuggerScopeView {
  element: DebuggerPanelSection;

  constructor() {

    this.element = new DebuggerPanelSection
    this.element.innerHTML = 'DebuggerScopeView'
  }

  getElement(): DebuggerPanelSection {
    return this.element
  }
}
