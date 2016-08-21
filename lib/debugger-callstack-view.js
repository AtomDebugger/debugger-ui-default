'use babel'

/* @flow */

import DebuggerPanelSection from './debugger-panel-section'
import { File }             from 'atom'

import type {
  DebuggerController,
  DebuggerProxy,
  SessionEvent,
  StackFrame
}                           from 'debugger'

class DebuggerCallstackViewPrivate {
  element: DebuggerPanelSection;
  callStackElement: HTMLElement;
  selectedItem:     ?HTMLElement;

  debuggerProxy: DebuggerProxy;

  createCallbacks(): void {

    const proxy = this.debuggerProxy

    proxy.onSessionEvent( (event: SessionEvent) => {

      if (event.type != 'suspended') { return }

      Promise.all([proxy.getCallStack(), proxy.getSelectedFrame()])
      .then( (result: [Array<StackFrame>, StackFrame]) => {
        const stack    = result[0]
        const selected = result[1]

        for (let i=0; i<stack.length; i++) {
          this.createStackFrameView(stack[i], stack[i].level === selected.level)
        }
      })
    })

    proxy.onSessionEvent( (event: SessionEvent) => {

      if (event.type != 'resumed') { return }

      this.callStackElement.innerHTML = ''
    })

    proxy.onSessionEvent( (event: SessionEvent) => {

      if (event.type != 'terminated') { return }

      this.callStackElement.innerHTML = ''
    })

  }

  createCallStackView(): void {

    const list = document.createElement('ol')

    list.classList.add('list-group')

    this.element.appendChild(list)
    this.callStackElement = list
  }

  createStackFrameView(frame: StackFrame, isSelected: bool): void {

    const proxy     = this.debuggerProxy
    const frameView = document.createElement('li')
    this.callStackElement.appendChild(frameView)

    frameView.classList.add('stack-frame')

    if (isSelected) {
      frameView.classList.add('selected')
      this.selectedItem = frameView
    }

    frameView.addEventListener('click', event => {
      if (this.selectedItem === frameView) { return }

      if (this.selectedItem) {
        this.selectedItem.classList.remove('selected')
      }

      frameView.classList.add('selected')
      this.selectedItem = frameView
      proxy.setSelectedFrame(frame.level)
    })

    const levelElement = document.createElement('span')
    frameView.appendChild(levelElement)

    levelElement.classList.add('level')
    levelElement.appendChild(new Text(frame.level))

    const functionElement = document.createElement('span')
    frameView.appendChild(functionElement)

    functionElement.classList.add('function', 'code')
    functionElement.appendChild(new Text(frame.function))

    if (!frame.filePath) {
      frameView.classList.add('disabled')
      return
    }

    frameView.addEventListener('dblclick', event => {
      atom.workspace.open(frame.filePath).then( editor => {
        if (frame.bufferRow) {
          editor.scrollToBufferPosition([frame.bufferRow,0])
        }
      })
    })

    const fileName    = new File(frame.filePath).getBaseName()
    const fileElement = document.createElement('span')
    frameView.appendChild(fileElement)

    fileElement.classList.add('file')
    fileElement.appendChild(new Text(fileName))

    if (frame.bufferRow) {
      const lineNumber        = frame.bufferRow + 1
      const lineNumberElement = document.createElement('span')
      frameView.appendChild(lineNumberElement)

      lineNumberElement.classList.add('line-number')
      lineNumberElement.appendChild(new Text(lineNumber))
    }
  }

  activate(controller: DebuggerController): void {

    this.debuggerProxy = controller.debuggerRegistry.getDebuggerProxy()

    this.createCallbacks()
    this.createCallStackView()
  }
}

export default class DebuggerCallstackView {
  element: DebuggerPanelSection;

  constructor() {

    const p = new DebuggerCallstackViewPrivate

    p.element = new DebuggerPanelSection

    p.element.classList.add('callstack-view')

    this.getElement = () => { return p.element }
    this.activate   = (controller) => { p.activate(controller) }
  }

  activate: (controller: DebuggerController) => void;

  getElement: () => DebuggerPanelSection;
}
