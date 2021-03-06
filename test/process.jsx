/* eslint-env mocha */
/** @jsx createElement */

import {createElement, compile} from 'elliptical'
import chai, {expect} from 'chai'
import createProcessor from '../src/processor'
import {spy} from 'sinon'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

describe('process', () => {
  it('calls register with the results of observe', () => {
    const Test = {
      observe () {
        return 3
      }
    }
    const register = spy()
    const process = createProcessor(register)
    compile(<Test />, process)

    expect(register).to.have.been.calledWith(3)
  })

  it('passes props to observe', () => {
    const Test = {
      observe ({props, children}) {
        expect(props).to.eql({num: 3})
        expect(children).to.eql([])
        return props.num + 3
      }
    }
    const register = spy()
    const process = createProcessor(register)
    compile(<Test num={3} />, process)

    expect(register).to.have.been.calledWith(6)
  })

  it('passes result of register to describe as data', () => {
    const Root = {
      observe () {
        return 3
      },
      describe ({data}) {
        expect(data).to.eql(6)
        return <literal text='test' value={data} />
      }
    }

    const register = spy((num) => num + 3)
    const process = createProcessor(register)
    compile(<Root />, process)

    expect(register).to.have.been.calledWith(3)
  })

  it('does not recompile unless changed', () => {
    const describeSpy = spy()
    const Root = {
      observe () {},
      describe ({data}) {
        describeSpy()
        return <literal text='test' value={data} />
      }
    }

    const register = () => 6
    const process = createProcessor(register)
    const parse = compile(<Root />, process)

    parse('')
    parse('t')
    parse('te')
    expect(describeSpy).to.have.been.calledOnce
  })

  it('does not recompile children unless changed', () => {
    const describeSpy = spy()
    const Child = {
      describe ({ props }) {
        describeSpy()
        return <literal text='test' value={props.data} />
      }
    }
    const Root = {
      observe () {},
      describe ({data}) {
        return <Child data={data} />
      }
    }

    const register = () => 6
    const process = createProcessor(register)
    const parse = compile(<Root />, process)

    parse('')
    parse('t')
    parse('te')
    expect(describeSpy).to.have.been.calledOnce
  })

  it('does not recompile children unless changed (nested)', () => {
    const describeSpy = spy()
    const Child = {
      describe ({ props }) {
        describeSpy()
        return <literal text='test' value={props.data} />
      }
    }
    const Root = {
      observe () {},
      describe ({data}) {
        return (
          <sequence>
            <literal text='test' />
            <Child data={data} />
          </sequence>
        )
      }
    }

    const register = () => 6
    const process = createProcessor(register)
    const parse = compile(<Root />, process)

    parse('')
    parse('t')
    parse('te')
    expect(describeSpy).to.have.been.calledOnce
  })

  it('passes result of register to visit as data', () => {
    const Root = {
      observe () {
        return 3
      },
      visit (opt, {data}, traverse) {
        expect(opt.text).to.equal('test')
        expect(data).to.eql(6)
        return traverse(<literal text='test' value={data}/>, opt)
      }
    }

    const register = spy((num) => num + 3)
    const process = createProcessor(register)
    const parse = compile(<Root />, process)

    expect(register).to.have.been.calledWith(3)
    
    const options = parse('test')
    expect(options).to.have.length(1)
    expect(options[0].result).to.equal(6)
  })

  it('can process sources', () => {
    function sourceProcessor (element) {
      expect(element).to.equal(3)
      return 6
    }

    const Test = {}
    const Root = {
      observe () {
        return 3
      },
      describe ({data}) {
        expect(data).to.eql(9)
        return <Test test={data} />
      }
    }

    const register = spy((num) => num + 3)
    const process = createProcessor(register, sourceProcessor)
    compile(<Root />, process)

    expect(register).to.have.been.calledWith(6)
  })
})
