'use babel'

import ComboBox from '../lib/combo-box'

describe('The ComboBox', () => {
  testee: ComboBox;

  beforeEach(() => {
    waitsForPromise(() => {
      return atom.packages.activatePackage('debugger-ui-default')
    })

    testee = new ComboBox()

    document.body.appendChild(testee)
  })

  it('complains when an element is added twice', () => {
    expect(() => { testee.addItem('test', {
      octicon: 'icon-beer',
      value: 'test'
    })}).not.toThrow()

    expect(() => { testee.addItem('test', {
      octicon: 'icon-beer',
      value: 'test'
    })}).toThrow()
  })
})
