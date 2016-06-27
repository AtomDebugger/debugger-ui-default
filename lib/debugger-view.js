'use babel'

/* @flow */
import { CompositeDisposable, TextEditorMarker } from 'atom'

export default class DebuggerView {
  subscriptions: CompositeDisposable;
  isActive: boolean;
  executionMarker: ?TextEditorMarker;

  constructor() {
    this.subscriptions = new CompositeDisposable
    this.isActive = false
    this.executionMarker = null
  }

  activate(controller): void {
    if (this.isActive) {
      return;
    }

    let debuggerRegistry = controller.debuggerRegistry

    this.subscriptions.add(
      debuggerRegistry.onIsRunning(data => {
        if (this.executionMarker) {
          this.executionMarker.destroy()
          this.executionMarker = null
        }
      })
    )

    this.subscriptions.add(
      debuggerRegistry.onStoppedExecution(data => {
        if (data.reason == 'breakpoint-hit') {
          atom.workspace.open(data.frame.fullname).then((editor) => {
            const marker = editor.markBufferRange(
              [[data.frame.line-1, 0], [data.frame.line-1, 0]])

            editor.decorateMarker(marker, { type: 'line-number', class: 'debugger-execution-line'})
            editor.scrollToBufferPosition([data.frame.line-1, 0])

            this.executionMarker = marker
          })
        }
      })
    )

    this.subscriptions.add(
      debuggerRegistry.onDidEndSession(data => {
        atom.notifications.addWarning('Ended session')

        if (this.executionMarker) {
          this.executionMarker.destroy()
          this.executionMarker = null
        }
      })
    )
  }

  dispose() {
    this.subscriptions.dispose()
  }
}
