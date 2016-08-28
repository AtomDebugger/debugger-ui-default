'use babel'

/* @flow */

import DebuggerPanel                             from './debugger-panel'
import DebuggerPanelMenu                         from './debugger-panel-menu'

import type { Breakpoint, DebuggerController }   from 'debugger'

import { CompositeDisposable, TextEditorMarker } from 'atom'
import _                                         from 'underscore-plus'
import fs                                        from 'fs-plus'
import path                                      from 'path'

type BreakpointMarker = { marker: TextEditorMarker, breakpoint: Breakpoint }

export default class DebuggerView {
  subscriptions:     CompositeDisposable;
  isActive:          boolean;
  executionMarker:   ?TextEditorMarker;
  breakpointMarkers: BreakpointMarker[];

  panelIsCreated:    bool;
  panel:             DebuggerPanel;
  panelMenu:         DebuggerPanelMenu;

  resourceElementMap: { [path: string]: HTMLElement };

  constructor() {
    this.subscriptions      = new CompositeDisposable()
    this.isActive           = false
    this.executionMarker    = null
    this.breakpointMarkers  = []
    this.panelIsCreated     = false
    this.resourceElementMap = {}
  }

  activate(controller: DebuggerController): void {

    if (this.isActive) {
      return;
    }

    let proxy = controller.debuggerRegistry.getDebuggerProxy()

    this.subscriptions.add(proxy.onSessionEvent( event => {

      if (event.type !== 'resumed') {
        return
      }

      this.clearExecutionMarker()
    }))

    this.subscriptions.add(proxy.onSessionEvent( event => {

      if (event.type !== 'suspended') {
        return
      }

      if (!event.executionLine || typeof event.executionLine !== 'object') {
        throw Error('SessionEvent.executionLine must be an object')
      } else if (typeof event.executionLine.filePath !== 'string') {
        return
      } else if (typeof event.executionLine.bufferRow !== 'number') {
        return
      }

      atom.workspace.open(event.executionLine.filePath).then((editor) => {

        const position = [ event.executionLine.bufferRow, 0 ]
        const range    = [ position, position ]
        const marker   = editor.markBufferRange(range, {invalidate:'never'})

        const decoration = {
          type:  'line-number',
          class: 'debugger-execution-line'
        }

        // $FlowAtomApiIssue: wants 'item' in options, but this is not used
        editor.decorateMarker(marker, decoration)
        editor.scrollToBufferPosition(position)

        this.executionMarker = marker
      })
    }))

    this.subscriptions.add(proxy.onSessionEvent(event => {

      if (event.type != 'terminated') {
        return
      }

      atom.notifications.addWarning('Debugging session has finished.')

      this.clearExecutionMarker()
    }))

    this.subscriptions.add(proxy.onBreakpointEvent( event => {

      if (event.type != 'inserted') {
        return
      }

      const location = event.breakpoint.location

      if (!('filePath' in location && 'bufferRow' in location)) {
        atom.notifications.addError(
          'Not yet implemented for this kind of breakpoint'
        )
        return
      }

      if (typeof location.filePath !== 'string') {
        throw new Error('location.filePath must be a string')
      }

      atom.workspace.open(location.filePath).then( editor => {

        if (typeof location.bufferRow !== 'number') {
          throw new Error('location.bufferRow must be a number')
        }

        const position = [ location.bufferRow, 0 ]
        const range    = [ position, position ]
        const marker   = editor.markBufferRange(range, {invalidate: 'never'})

        const decoration = {
          type:  'line-number',
          class: 'debugger-breakpoint-line'
        }

        // $FlowAtomApiIssue: wants 'item' in options, but this is not used
        editor.decorateMarker(marker, decoration)

        this.breakpointMarkers.push({
          marker: marker, breakpoint: event.breakpoint
        })
      })
    }))

    this.subscriptions.add(proxy.onBreakpointEvent( event => {

      if (event.type != 'removed') {
        return
      }

      const breakpoint = event.breakpoint
      const comparator = value => { return value.breakpoint.equals(breakpoint) }
      const element    = _.find(this.breakpointMarkers, comparator)

      if (typeof element === 'undefined') {
        atom.notifications.addWarning('Tried to remove non-existent marker')
        return
      }

      element.marker.destroy()

      this.breakpointMarkers = _.without(this.breakpointMarkers, element)
    }))

    this.createPanel()
    this.createSvgResource('debugger-icons.svg')

    if (this.panel.activate) { this.panel.activate(controller) }
  }

  dispose(): void {
    this.subscriptions.dispose()
  }

  clearExecutionMarker(): void {

    if (!this.executionMarker) {
      return
    }

    this.executionMarker.destroy()
    this.executionMarker = null
  }

  createPanel(): void {

    if (this.panelIsCreated) { return }

    const container = document.createElement('div')

    const options = {
      item: container,
      visible: true,
      priority: 99
    }

    atom.workspace.addBottomPanel(options)

    const grabber   = document.createElement('div')

    container.classList.add('debugger-panel-resizer')

    const style     = window.getComputedStyle(container)

    container.style.height = style.getPropertyValue('min-height') || '120px'

    grabber.classList.add('debugger-panel-resize-handle')

    grabber.addEventListener('mousedown', event => {

      const height   = style.getPropertyValue('height')
      const initial  = +height.replace(/px/, '') + event.screenY

      const listener = (event: MouseEvent) => {
        const minHeight = style.getPropertyValue('min-height')
        const height    = Math.max(
          initial - event.screenY, +minHeight.replace(/px/, '')
        )

        container.style.height = height + 'px'
      }

      // $FlowIssue: flow wants this callback to return something
      document.addEventListener('mousemove', listener)
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', listener)
      })
    })

    container.appendChild(grabber)

    this.panelMenu = new DebuggerPanelMenu()
    container.appendChild(this.panelMenu)

    this.panelMenu.getRightComboBox().onSelectedChanged( value => {
      this.panel.setRightSection(value)
    })

    this.panelMenu.getLeftComboBox().onSelectedChanged( value => {
      this.panel.setLeftSection(value)
    })

    this.panel = new DebuggerPanel()
    container.appendChild(this.panel)

    this.panelIsCreated = true
  }

  getResourcesPath(): string {

    const packagePath = atom.packages.resolvePackagePath('debugger-ui-default')

    if (!packagePath) {
      throw new Error('Could not find package')
    }

    return path.join(packagePath, 'resources')
  }

  createSvgResource(svgResourceName: string): void {

    const source = this.loadSvgFile(svgResourceName)

    const svgResourcePath = path.normalize(
      path.join(this.getResourcesPath(), svgResourceName)
    )

    const element = document.createElement('div')
    element.innerHTML = source

    if (!this.panel) { return }

    this.panel.insertBefore(element, this.panel.firstChild)
    this.resourceElementMap[svgResourcePath] = element

    this.registerSvgResourceListener(svgResourceName)
  }

  loadSvgFile(svgResourceName: string): string {

    const source = fs.readFileSync(
      path.join(this.getResourcesPath(), svgResourceName), 'utf8'
    )

    return source.replace(/<\?xml.*\?>/g, '')
  }

  registerSvgResourceListener(svgResourceName: string): void {

    const svgResourcePath = path.normalize(
      path.join(this.getResourcesPath(), svgResourceName)
    )

    atom.workspace.observeTextEditors( editor => {

      const subscriptions = new CompositeDisposable

      subscriptions.add(editor.onDidSave( event => {

        if (path.normalize(event.path) !== svgResourcePath) { return }

        const source = this.loadSvgFile(svgResourceName)

        this.resourceElementMap[svgResourcePath].innerHTML = source
      }))

      subscriptions.add(editor.onDidDestroy( editor => {
        subscriptions.dispose()
      }))
    })
  }
}
