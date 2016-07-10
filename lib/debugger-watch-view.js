'use babel'

/* @flow */
import DebuggerPanelSection from './debugger-panel-section'

export default class DebuggerWatchView {
  element: DebuggerPanelSection;

  constructor() {

    this.element = new DebuggerPanelSection
    this.element.innerHTML = 'DebuggerWatchView'
  }

  getElement(): DebuggerPanelSection {
    return this.element
  }
}
