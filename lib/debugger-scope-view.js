'use babel'

/* @flow */

import DebuggerPanelSection from './debugger-panel-section'

import type {
  DebuggerController,
  DebuggerProxy,
  SessionEvent,
  Variable
}                           from 'debugger'

class DebuggerScopeViewPrivate {
  element: DebuggerPanelSection;
  variableListElement: HTMLElement;

  debuggerProxy: DebuggerProxy;

  createCallbacks(): void {

    const proxy = this.debuggerProxy

    proxy.onSessionEvent( (event: SessionEvent) => {

      if (event.type !== 'suspended') { return }

      const list = this.variableListElement

      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }

      proxy.getVariableList().then( (result: Array<Variable>) => {
        for (let i=0; i<result.length; i++) {
          this.createVariableView(result[i])
        }
      })
    })

    proxy.onFrameChange( () => {
      const list = this.variableListElement

      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }

      proxy.getVariableList().then( (result: Array<Variable>) => {
        for (let i=0; i<result.length; i++) {
          this.createVariableView(result[i])
        }
      })
    })

    proxy.onSessionEvent( (event: SessionEvent) => {

      if (event.type !== 'resumed') { return }

      const list = this.variableListElement

      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }
    })

    proxy.onSessionEvent( (event: SessionEvent) => {

      if (event.type !== 'terminated') { return }

      const list = this.variableListElement

      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }
    })
  }

  createScopeView(): void {

    const list = document.createElement('ul')

    list.classList.add('list-group')

    this.element.appendChild(list)
    this.variableListElement = list
  }

  createVariableView(variable: Variable): void {

    const variableView = document.createElement('li')
    this.variableListElement.appendChild(variableView)

    variableView.classList.add('variable')

    const nameDiv     = document.createElement('div')
    const nameElement = document.createElement('span')
    variableView.appendChild(nameDiv)
    nameDiv.appendChild(nameElement)

    nameDiv.classList.add('name')
    nameElement.classList.add('name', 'highlight')
    nameElement.appendChild(new Text(variable.name))

    const typeElement = document.createElement('span')
    variableView.appendChild(typeElement)

    typeElement.classList.add('type')
    typeElement.appendChild(new Text(variable.type))

    const spacerElement = document.createElement('span')
    variableView.appendChild(spacerElement)

    spacerElement.classList.add('spacer')

    if (variable.value !== undefined) {
      const valueElement = document.createElement('span')
      variableView.appendChild(valueElement)

      valueElement.classList.add('value')

      if (variable.value !== null) {
        valueElement.appendChild(new Text(variable.value))
      } else {
        valueElement.appendChild(new Text('unknown'))
        valueElement.classList.add('unknown')
      }
    }
  }

  activate(controller: DebuggerController): void {

    this.debuggerProxy = controller.debuggerRegistry.getDebuggerProxy()

    this.createCallbacks()
    this.createScopeView()
  }
}

export default class DebuggerScopeView {
  element: DebuggerPanelSection;

  constructor() {

    const p = new DebuggerScopeViewPrivate

    p.element = new DebuggerPanelSection

    p.element.classList.add('scope-view')

    this.getElement = () => { return p.element }
    this.activate   = (controller) => { p.activate(controller) }
  }

  activate: (controller: DebuggerController) => void;

  getElement: () => DebuggerPanelSection;
}
