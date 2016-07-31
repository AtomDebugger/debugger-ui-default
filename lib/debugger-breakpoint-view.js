'use babel'

/* @flow */

import DebuggerPanelSection from './debugger-panel-section'

import type {
  Breakpoint,
  BreakpointEvent,
  DebuggerController,
  DebuggerProxy
}                           from 'debugger'

import { Directory, File }  from 'atom'
import _                    from 'underscore-plus'

class DebuggerBreakpointViewPrivate {
  element: DebuggerPanelSection;
  projectListElement: HTMLDivElement;

  // $FlowIssue: HTMLLIElement is not defined in flow
  backgroundMessage:  HTMLLIElement;
  selectedItem:       ?HTMLLIElement;

  debuggerProxy:      DebuggerProxy;

  createBackgroundMessage(): void {

    let keybinding
    {
      const keybindings = atom.keymaps.findKeyBindings({
        command: 'debugger:toggle-breakpoint-at-current-line'
      })

      keybinding = keybindings[0]

      for (let binding of keybindings) {
        if (binding.selector.indexOf(process.platform) !== -1) {

          keybinding = binding
          break
        }
      }
    }

    const keystrokeSpan = document.createElement('kbd')
    keystrokeSpan.classList.add('key-binding')
    keystrokeSpan.appendChild(new Text(
     _.humanizeKeystroke(keybinding.keystrokes).replace(/\s+/g, '&nbsp;')
    ))

    this.backgroundMessage = document.createElement('li')
    this.backgroundMessage.appendChild(
      new Text('You can quickly toggle breakpoints in the editor with')
    )
    this.backgroundMessage.appendChild(keystrokeSpan)
    this.backgroundMessage.appendChild(new Text('.'))
  }

  createCallbacks(): void {

    const proxy = this.debuggerProxy

    proxy.onBreakpointEvent( (event: BreakpointEvent) => {

      if (event.type !== 'inserted') { return }

      try {
        this.createBreakpointView(event.breakpoint)

      } catch (e) {
        atom.notifications.addFatalError(
          'Something went wrong in the debugger-ui-default package!', {
          detail: e.stack,
          dismissable: true
        })
      }
    })

    proxy.onBreakpointEvent( (event: BreakpointEvent) => {

      if (event.type !== 'removed') { return }

      try {
        this.destroyBreakpointView(event.breakpoint)

      } catch (e) {
        atom.notifications.addFatalError(
          'Something went wrong in the debugger-ui-default package!', {
          detail: e.stack,
          dismissable: true
        })
      }
    })
  }

  createProjectList(): void {

    const proxy = this.debuggerProxy

    const list = document.createElement('ul')

    list.classList.add('list-tree', 'has-collapsable-children')

    this.element.appendChild(list)
    this.projectListElement = list

    if (!this.backgroundMessage) { this.createBackgroundMessage() }

    this.displayBackgroundMessage()

    const observer = new MutationObserver(mutationRecords => {

      const children = _.without(
        this.projectListElement.children, this.backgroundMessage
      )

      const parent      = this.backgroundMessage.parentNode
      const isDisplayed = (parent === this.projectListElement)

      if (children.length === 0) { this.displayBackgroundMessage() }
      else if (isDisplayed)      { this.hideBackgroundMessage() }
    })

    observer.observe(this.projectListElement, {childList: true, subtree: false})
  }

  createProjectView(projectPath: ?string): HTMLLIElement {

    const projectElement = document.createElement('li')

    projectElement.classList.add('list-nested-item', 'project')

    const headerDiv = document.createElement('div')
    const header    = document.createElement('span')
    projectElement.appendChild(headerDiv)
    header.classList.add('icon')
    headerDiv.appendChild(header)
    headerDiv.addEventListener('click', event => {

      if (event.shiftKey || event.metaKey || event.ctrlKey) { return }

      if (projectElement.classList.contains('collapsed')) {
        projectElement.classList.remove('collapsed')
      } else {
        projectElement.classList.add('collapsed')
      }
    })

    headerDiv.classList.add('list-item')

    if (projectPath) {

      const directory = new Directory(projectPath)

      header.appendChild(new Text(directory.getBaseName()))
      header.classList.add('icon-repo')

      projectElement.dataset.path = projectPath
    } else {

      projectElement.classList.add('external')
      header.appendChild(new Text('external'))
      header.classList.add('icon-file-directory')

      projectElement.dataset.external = ''
    }

    const content = document.createElement('ul')
    projectElement.appendChild(content)

    content.classList.add('list-tree')

    this.projectListElement.appendChild(projectElement)

    return projectElement
  }

  createFileView(
    projectElement: HTMLLIElement,
    relativePath: string): HTMLLIElement {

    const fileListElement = projectElement.querySelector('.list-tree')
    const fileElement     = document.createElement('li')

    fileElement.classList.add('list-nested-item', 'file')

    fileElement.dataset.name = relativePath

    const headerDiv = document.createElement('div')
    const header    = document.createElement('span')
    fileElement.appendChild(headerDiv)
    headerDiv.appendChild(header)
    headerDiv.addEventListener('click', event => {

      if (event.shiftKey || event.metaKey || event.ctrlKey) { return }

      if (fileElement.classList.contains('collapsed')) {
        fileElement.classList.remove('collapsed')
      } else {
        fileElement.classList.add('collapsed')
      }
    })

    headerDiv.classList.add('list-item')

    header.appendChild(new Text(relativePath))
    header.classList.add('icon', 'icon-file-text')

    const content = document.createElement('ul')
    fileElement.appendChild(content)

    content.classList.add('list-tree', 'has-flat-children')

    fileListElement.appendChild(fileElement)

    return fileElement
  }

  createBreakpointView(breakpoint: Breakpoint): void {

    const location = breakpoint.location

    if (!location.filePath || !location.bufferRow) {
      throw new Error('Not implemented for this type of breakpoint location')
    }

    const filePath                   = location.filePath
    const bufferRow                  = location.bufferRow
    const [projectPath,relativePath] = atom.project.relativizePath(filePath)

    const file = new File(relativePath)

    let projectElement = this.findProjectView(projectPath)

    if (!projectElement) {
      projectElement = this.createProjectView(projectPath)
    }

    let fileElement = this.findFileView(projectElement, relativePath)


    if (!fileElement) {
      fileElement = this.createFileView(projectElement, relativePath)
    }

    const breakpointListElement = fileElement.querySelector('.list-tree')

    const breakpointElement = document.createElement('li')
    breakpointListElement.appendChild(breakpointElement)

    breakpointElement.classList.add('list-item', 'breakpoint')
    breakpointElement.style.order = bufferRow.toString()

    const lineNumber = (typeof breakpoint.activeBufferRow === 'number') ?
      breakpoint.activeBufferRow + 1 : bufferRow + 1

    const lineNumberElement = document.createElement('span')
    breakpointElement.appendChild(lineNumberElement)
    breakpointElement.addEventListener('click', event => {
      if (this.selectedItem) {
        this.selectedItem.classList.remove('selected')
      }

      breakpointElement.classList.add('selected')
      this.selectedItem = breakpointElement

      atom.workspace.open(filePath).then((editor) => {
        editor.scrollToBufferPosition([lineNumber-1,0])
      })
    })

    breakpointElement.dataset.line = '' + lineNumber

    lineNumberElement.classList.add('line-number')
    lineNumberElement.appendChild(new Text(lineNumber))

    const descriptionElement = document.createElement('span')
    breakpointElement.appendChild(descriptionElement)

    descriptionElement.classList.add('description', 'code')

    atom.workspace.open(filePath, { searchAllPanes: true }).then(
      editor => {
      const description = editor.lineTextForBufferRow(bufferRow)

      descriptionElement.appendChild(new Text(description))
    })
  }

  destroyBreakpointView(breakpoint: Breakpoint) {

    const location = breakpoint.location

    if (!location.filePath || !location.bufferRow) {
      throw new Error('Not implemented for this type of breakpoint location')
    }

    const filePath                   = location.filePath
    const bufferRow                  = location.bufferRow
    const [projectPath,relativePath] = atom.project.relativizePath(filePath)

    const file           = new File(relativePath)
    const projectElement = this.findProjectView(projectPath)

    if (!projectElement) {
      throw new Error(
        'Couldn\'t find HTML element for project of breakpoint "' +
        breakpoint.toHumanized() + '"'
      )
    }

    const fileElement = this.findFileView(projectElement, relativePath)

    if (!fileElement) {
      throw new Error(
        'Couldn\'t find HTML element for file of breakpoint "' +
        breakpoint.toHumanized() + '"'
      )
    }

    const breakpointListElement = fileElement.querySelector('.list-tree')

    const lineNumber = (typeof breakpoint.activeBufferRow === 'number') ?
      breakpoint.activeBufferRow + 1 : bufferRow + 1

    let breakpointElement
    for (let i=0; i<breakpointListElement.children.length; i++) {

      const child = breakpointListElement.children[i]

      if (child.dataset.line === lineNumber.toString()) {
        breakpointElement = child
        break
      }
    }

    if (!breakpointElement) {
      throw new Error(
        'Couldn\'t find HTML element for breakpoint "' +
        breakpoint.toHumanized() + '"'
      )
    }

    breakpointListElement.removeChild(breakpointElement)

    const fileListElement = projectElement.querySelector('.list-tree')

    if (breakpointListElement.children.length === 0) {
      fileListElement.removeChild(fileElement)
    }

    if (fileListElement.children.length === 0) {
      this.projectListElement.removeChild(projectElement)
    }
  }

  displayBackgroundMessage(): void {

    this.projectListElement.appendChild(this.backgroundMessage)
    this.projectListElement.classList.add('background-message', 'centered')
  }

  hideBackgroundMessage(): void {

    this.projectListElement.removeChild(this.backgroundMessage)
    this.projectListElement.classList.remove('background-message', 'centered')
  }

  findProjectView(projectPath: ?string): ?HTMLLIElement {

    for (let i=0; i<this.projectListElement.children.length; i++) {

      const child = this.projectListElement.children[i]

      const isProjectElement  = (projectPath && child.dataset.path === projectPath)
      const isExternalElement = (!projectPath && child.dataset.external === '')

      const isSearchedElement = (isProjectElement || isExternalElement)

      if (isSearchedElement) { return child }
    }
  }

  findFileView(
    projectElement: HTMLLIElement,
    relativePath:   string): ?HTMLLIElement {

    const fileListElement = projectElement.querySelector('.list-tree')

    for (let i=0; i<fileListElement.children.length; i++) {

      const child = fileListElement.children[i]

      if (child.dataset.name === relativePath) {
        return child
      }
    }
  }

  removeBreakpoint(breakpointItem: HTMLLIElement): void {

    const fileItem       = breakpointItem.closest('.file')
    const projectItem    = fileItem.closest('.project')

    let   filePath
    const bufferRow = breakpointItem.dataset.line - 1

    if (projectItem.dataset.external === '') {
      filePath = new File(fileItem.dataset.name)
    } else {
      const directory = new Directory(projectItem.dataset.path)
            filePath  = directory.getFile(fileItem.dataset.name)
    }

    const breakpoint = this.debuggerProxy.findBreakpoint({
      filePath: filePath.getPath(),
      bufferRow: bufferRow
    })

    if (!breakpoint || this.debuggerProxy.removeBreakpoint(breakpoint)) {
      throw new Error('Couldn\'t remove breakpoint "' +
        filePath.getPath() + ':' + bufferRow + '"')
    }
  }

  activate(controller: DebuggerController): void {

    this.debuggerProxy = controller.debuggerRegistry.getDebuggerProxy()

    atom.commands.add('.list-item.breakpoint', {
      'debugger:edit-condition': () => { atom.notifications.addError('edit-condition') },
      'debugger:remove-breakpoint': event => { this.removeBreakpoint(event.currentTarget) },
      'debugger:disable-breakpoint': () => { atom.notifications.addError('disable-breakpoint') }
    })

    this.createCallbacks()
    this.createProjectList()
  }
}

export default class DebuggerBreakpointView {

  constructor() {

    const p = new DebuggerBreakpointViewPrivate

    p.element = new DebuggerPanelSection

    p.element.classList.add('breakpoint-view')

    this.getElement = () => { return p.element }
    this.activate   = (controller) => { p.activate(controller) }
  }

  activate: (controller: DebuggerController) => void;

  getElement: () => DebuggerPanelSection;
}
