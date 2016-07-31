'use babel'

/* @flow */

import DebuggerPanelSection        from './debugger-panel-section'
import DebuggerBreakpointView      from './debugger-breakpoint-view'
import DebuggerCallstackView       from './debugger-callstack-view'
import DebuggerScopeView           from './debugger-scope-view'
import DebuggerTerminalView        from './debugger-terminal-view'
import DebuggerWatchView           from './debugger-watch-view'

import type { DebuggerController } from 'debugger'

type PanelViewType     = 'breakpoints' | 'scope' | 'watch' | 'call-stack' | 'terminal';
type DebuggerPanelView = { getElement: (() => DebuggerPanelSection) };

class DebuggerPanel extends HTMLElement {
  leftSection:    DebuggerPanelSection;
  rightSection:   DebuggerPanelSection;
  resizeHandle:   HTMLElement;
  resizeListener: EventListener;
  views:          { [key: PanelViewType]: DebuggerPanelView };

  attachedCallback(): void {

    if (!this.resizeHandle) { this.createPanel() }
    if (!this.views)        { this.createViews() }

    this.classList.add('padded')

    this.setLeftSection('scope')
    this.setRightSection('call-stack')
  }

  activate(controller: DebuggerController): void {

    if (!this.resizeHandle) { this.createPanel() }
    if (!this.views)        { this.createViews() }

    const keys = Object.keys(this.views)
    for (let i=0; i<keys.length; i++) {
      const view = this.views[keys[i]]

      if (view.activate) { view.activate(controller) }
    }
  }

  createPanel(): void {

    this.resizeHandle = document.createElement('div')
    this.resizeHandle.style.left= "211px"

    this.resizeHandle.classList.add('debugger-section-resize-handle')
  }

  createViews(): void {

    this.views = {}

    this.views['breakpoints'] = new DebuggerBreakpointView()
    this.views['call-stack']  = new DebuggerCallstackView()
    this.views['scope']       = new DebuggerScopeView()
    this.views['terminal']    = new DebuggerTerminalView()
    this.views['watch']       = new DebuggerWatchView()
  }

  setLeftSection(viewType: PanelViewType) {

    const element = this.views[viewType].getElement()

    element.appendChild(this.resizeHandle)

    let minWidth, maxWidth
    if (this.leftSection) {
      minWidth = this.leftSection.style.minWidth
      maxWidth = this.leftSection.style.maxWidth
    } else {
      minWidth = '200px'
      maxWidth = '200px'
    }

    element.style.minWidth = minWidth
    element.style.maxWidth = maxWidth

    if (this.resizeListener) {
      this.resizeHandle.removeEventListener('mousedown', this.resizeListener)
    }

    this.resizeListener = () => {

      const listener = (event) => {
        const old = Number(this.leftSection.style.minWidth.replace(/px/, ''))
        this.leftSection.style.minWidth = `${old + event.movementX}px`
        this.leftSection.style.maxWidth = `${old + event.movementX}px`
        this.resizeHandle.style.left    = `${old + event.movementX + 11}px`
      }

      // $FlowIssue: flow wants this callback to return something
      document.addEventListener('mousemove', listener)
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', listener)
      })
    }

    this.resizeHandle.addEventListener('mousedown', this.resizeListener)

    if (this.leftSection) {
      this.replaceChild(element, this.leftSection)
    } else if (this.firstChild){
      this.insertBefore(element, this.firstChild)
    } else {
      this.appendChild(element)
    }

    this.leftSection = element
  }

  setRightSection(viewType: PanelViewType) {

    const element = this.views[viewType].getElement()

    if (this.rightSection) {
      this.replaceChild(element, this.rightSection)
    } else {
      this.appendChild(element)
    }

    this.rightSection = element
  }
}

const DebuggerPanelConstructor = document.registerElement(
  'debugger-panel', DebuggerPanel
)

export default DebuggerPanelConstructor
