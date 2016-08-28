'use babel'

/* @flow */

import DebuggerPanelSection from './debugger-panel-section'

import type {
  DebuggerController,
  DebuggerProxy,
  SessionEvent,
  Variable,
  VariableEvent
}                           from 'debugger'

const errorHandler = (error: mixed) => {
  const message = (error && error.msg) ? error.msg : 'Unknown error occured'
  atom.notifications.addError(message, { dismissable: true })
}

class DebuggerScopeViewPrivate {
  element: DebuggerPanelSection;
  variableListElement: HTMLElement;

  debuggerProxy: DebuggerProxy;

  createCallbacks(): void {

    const proxy = this.debuggerProxy

    proxy.onVariableEvent( (event: VariableEvent) => {

      if (event.type !== 'entered-scope') { return }

      this.createVariableView(event.variable, this.variableListElement)
    })

    proxy.onVariableEvent( (event: VariableEvent) => {

      if (event.type !== 'left-scope') { return }

      const element = document.querySelector(`[data-id='${event.variable.id}']`)

      if (!element) { throw new Error('Could not find corresponding element') }

      const parent = element.parentElement

      if (parent) { parent.removeChild(element) }
    })
  }

  createScopeView(): void {

    const list = document.createElement('ul')

    list.classList.add('list-tree', 'has-collapsable-children')

    this.element.appendChild(list)
    this.variableListElement = list
  }

  createVariableView(variable: Variable, parent: HTMLElement): void {

    let variableView = document.createElement('li')
    parent.appendChild(variableView)

    variableView.dataset.id = variable.id

    if (variable.has_children) {
      variableView.classList.add('list-nested-item', 'collapsed')
      let variableHeader = document.createElement('div')
      variableView.appendChild(variableHeader)

      variableHeader.classList.add('list-item')

      const view = variableView

      variableHeader.addEventListener('click', event => {

        if (event.shiftKey || event.metaKey || event.ctrlKey) { return }

        if (view.classList.contains('collapsed')) {
          view.classList.remove('collapsed')

          if (!view.querySelector('.list-tree')) {
            const proxy     = this.debuggerProxy
            const childView = document.createElement('ul')
            childView.classList.add('list-tree')

            view.appendChild(childView)

            proxy.getVariableChildren(variable)
            .then( (children: Array<Variable>) => {
              for (let i=0; i<children.length; i++) {
                this.createVariableView(children[i], childView)
              }
            }, errorHandler)
          }
        } else {
          view.classList.add('collapsed')
        }
      })

      variableView = variableHeader
    } else {
      variableView.classList.add('list-item')
    }

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
