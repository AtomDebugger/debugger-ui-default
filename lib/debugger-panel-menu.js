'use babel'

/* @flow */
import ComboBox from './combo-box'

class DebuggerPanelMenu extends HTMLElement {

  getLeftComboBox:  (() => ComboBox);
  getRightComboBox: (() => ComboBox);

  attachedCallback(): void {

    const resumeGroup = document.createElement('div')

    resumeGroup.classList.add('btn-group')
    this.appendChild(resumeGroup)

    const resumeButton = this.createSvgButton('#debugger-resume')

    resumeButton.classList.add('disabled')
    resumeGroup.appendChild(resumeButton)

    const stepGroup = document.createElement('div')

    stepGroup.classList.add('btn-group')
    this.appendChild(stepGroup)

    stepGroup.appendChild(this.createSvgButton('#debugger-step-over'))
    stepGroup.appendChild(this.createSvgButton('#debugger-step-into'))
    stepGroup.appendChild(this.createSvgButton('#debugger-step-out'))

    const spacer = document.createElement('div')

    spacer.classList.add('spacer')
    this.appendChild(spacer)

    const viewSelectorGroup = document.createElement('div')

    viewSelectorGroup.classList.add('btn-group')
    this.appendChild(viewSelectorGroup)

    /* Left side */
    const leftComboBox = new ComboBox()
    viewSelectorGroup.appendChild(leftComboBox)

    leftComboBox.addItem('Watch', {
      octicon: 'icon-eye',
      value:   'watch'
    })

    leftComboBox.addItem('Scope', {
      octicon: 'icon-code',
      value:   'scope'
    })

    leftComboBox.setSelected('scope')

    this.getLeftComboBox = () => { return leftComboBox }

    /* Right side */
    const rightComboBox = new ComboBox()
        viewSelectorGroup.appendChild(rightComboBox)

    rightComboBox.addItem('Breakpoints', {
      octicon: 'icon-issue-opened',
      value:   'breakpoints'
    })

    rightComboBox.addItem('Call Stack', {
      octicon: 'icon-list-ordered',
      value:   'call-stack'
    })

    rightComboBox.addItem('Terminal', {
      octicon: 'icon-terminal',
      value:   'terminal'
    })

    rightComboBox.setSelected('call-stack')

    this.getRightComboBox = () => { return rightComboBox }
  }

  createSvgButton(iconId: string): HTMLButtonElement {

    const svgNamespace   = 'http://www.w3.org/2000/svg'
    const xlinkNamespace = 'http://www.w3.org/1999/xlink'
    const xmlnsNamespace = 'http://www.w3.org/2000/xmlns/'

    const button = document.createElement('button')

    button.classList.add('btn')

    const icon = document.createElementNS(svgNamespace, 'svg')
    button.appendChild(icon)

    icon.classList.add('icon')
    icon.setAttributeNS(xmlnsNamespace, 'xmlns',       svgNamespace)
    icon.setAttributeNS(xmlnsNamespace, 'xmlns:xlink', xlinkNamespace)

    const iconUse = document.createElementNS(svgNamespace, 'use')
    icon.appendChild(iconUse)

    iconUse.setAttributeNS(xlinkNamespace, 'xlink:href', iconId)

    return button
  }
}

const DebuggerPanelMenuConstructor = document.registerElement(
  'debugger-panel-menu', DebuggerPanelMenu
)

export default DebuggerPanelMenuConstructor
