'use babel'

/* @flow */

import type { Breakpoint, DebuggerController }   from 'debugger'

import { CompositeDisposable, TextEditorMarker } from 'atom'
import _                                         from 'underscore-plus'

type BreakpointMarker = { marker: TextEditorMarker, breakpoint: Breakpoint }

export default class DebuggerView {
  subscriptions:     CompositeDisposable;
  isActive:          boolean;
  executionMarker:   ?TextEditorMarker;
  breakpointMarkers: BreakpointMarker[];

  constructor() {
    this.subscriptions     = new CompositeDisposable()
    this.isActive          = false
    this.executionMarker   = null
    this.breakpointMarkers = []
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
        throw Error('SessionEvent.executionLine.filePath must be a string')
      } else if (typeof event.executionLine.bufferRow !== 'number') {
        throw Error('SessionEvent.executionLine.bufferRow must be a string')
      }

      atom.workspace.open(event.executionLine.filePath).then((editor) => {

        const position = [ event.executionLine.bufferRow, 0 ]
        const range    = [ position, position ]
        const marker   = editor.markBufferRange(range, {invalidate:'never'})

        const decoration = {
          type:  'line-number',
          class: 'debugger-execution-line'
        }

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
}
