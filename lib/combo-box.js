'use babel'

/* @flow */

import { Disposable, Emitter } from 'atom'
import _                       from 'underscore-plus'

export type ComboBoxOptions = { octicon: string, value: string }

class ComboBox extends HTMLButtonElement {
  emitter:  Emitter;
  text:     Text;
  values:   HTMLElement[];
  dropDown: HTMLElement;

  // $FlowIssue: flow wants the custom element callbacks to return something
  attachedCallback(): void {

    this.emitter  = new Emitter
    this.values   = []

    this.text = new Text()
    this.appendChild(this.text)

    const spacer  = document.createElement('span')
    spacer.classList.add('spacer')

    this.appendChild(spacer)

    if (!this.dropDown) {
      this.createDropDown()
    }
  }

  createDropDown(): void {

    this.dropDown = document.createElement('div')
    this.dropDown.classList.add('drop-down')

    this.appendChild(this.dropDown)
    this.dropDown.style.display = 'none'

    this.addEventListener('click', event => {
      if (event.target.parentNode === this.dropDown) return

      this.dropDown.style.display = 'flex'
    })
  }

  addItem(text: string, options: ComboBoxOptions): void {

    let element = _.find(this.values, value => {
      return (value.getAttribute('value') === options.value)
    })

    if (element) { throw Error('Element exists') }

    element = document.createElement('button')

    element.textContent = text
    element.classList.add('btn', 'combo-box', 'icon', options.octicon)
    element.setAttribute('value', options.value)
    element.setAttribute('index', this.values.length.toString())

    const spacer  = document.createElement('span')
    spacer.classList.add('spacer')

    element.appendChild(spacer)

    if (!this.dropDown) { this.createDropDown() }

    this.dropDown.appendChild(element)
    this.values.push(element)

    element.addEventListener('click', event => {

      this.dropDown.style.display = 'none'

      this.setSelected(element)
    })

    if (!this.getSelected()) { this.setSelected(element) }
  }

  setSelected(value: string | HTMLElement): void {

    if (typeof value === 'string') {
      var element = _.find(this.values, element => {
        return (element.getAttribute('value') === value)
      })

      if (!element) { throw new Error('Value not found') }
    } else if (value instanceof HTMLElement) {
      var element = value
    } else {
      throw new TypeError
    }

    this.text.nodeValue = element.textContent
    this.className      = element.className

    const newValue =  element.getAttribute('value')
    const newIndex = +element.getAttribute('index')

    let offset = -newIndex * this.offsetHeight
    {
      const style   = window.getComputedStyle(this)
      const border  = style.getPropertyValue('border-top-width')
            offset += -border.replace(/px/, '')
    }

    for (let i=0; i<=newIndex; i++) {
      const style   = window.getComputedStyle(this.dropDown.children[i])
      const margin  = style.getPropertyValue('margin-top')
            offset += -margin.replace(/px/, '')
    }

    this.dropDown.style.top = offset + 'px'

    this.setAttribute('value', newValue)

    this.emitter.emit('selected-changed', newValue)
  }

  getSelected(): string {
    return this.getAttribute('value')
  }

  onSelectedChanged(callback: ((value: string) => void)): Disposable {
    return this.emitter.on('selected-changed', callback)
  }
}

const ComboBoxConstructor = document.registerElement(
  'combo-box', {
  prototype: ComboBox.prototype,
  extends: 'button'
})

export default ComboBoxConstructor
