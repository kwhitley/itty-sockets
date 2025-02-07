import { describe, expect, it, spyOn, mock } from 'bun:test'
import { chroma } from './chroma'

const isChroma = (instance: any) => typeof instance.a.b.c === 'function'

describe('chroma', () => {
  it('is a function', () => {
    expect(typeof chroma).toBe('function')
  })

  it('returns the the chroma Proxy', () => {
    expect(isChroma(chroma)).toBe(true)
  })

  it('expty execution returns nothing', () => {
    expect(typeof chroma()).toBe('undefined')
  })

  it('returns an infinite Proxy chain', () => {
    expect(typeof chroma.a.b.c.d.e.f).toBe('function')
  })

  it('executing any node returns an array (unless log type specified)', () => {
    expect(Array.isArray(chroma.a.b.c('xyz'))).toBe(true)
  })
  it('executing any node logs if log type specified', () => {
    const log = spyOn(console, 'log').mockImplementation(() => {})
    const result = chroma.a.b.log.d('xyz')
    expect(Array.isArray(result)).toBe(false)
    expect(result).toBe(undefined)
    expect(log).toHaveBeenCalledTimes(1)
    log.mockRestore()
  })
  
  describe('output support', () => {
    const types = ['log', 'warn', 'error']

    for (const type of types) {
      const log = spyOn(console, type).mockImplementation(() => {})
      it(`.${type}`, () => {
        chroma[type]('hey')
        expect(log).toHaveBeenCalledTimes(1)
        log.mockRestore()
      })
    }
  })

  describe('style support', () => {
    type Feature = [
      property: string,
      match: string,
      argument?: string | number,
    ]
    const features: Array<Feature> = [
      ['color', 'color', '#aaa'],
      ['bold', 'font-weight:bold'],
      ['italic', 'font-style:italic'],
      ['underline', 'text-decoration:underline'],
      ['strike', 'text-decoration:line-through'],
      ['font', 'font-family', 'Georgia'],
      ['size', 'font-size', '0.9em'],
      ['bg', 'background', 'rgba(255,0,0,0.3)'],
      ['radius', 'border-radius', '3px'],
      ['padding', 'padding', '#aaa'],
      ['border', 'border', '1px solid red'],
    ]

    for (const [property, match, argument] of features) {
      it(argument ? `.${property}("${argument}")` : `.${property}`, () => {
        // @ts-ignore
        const out = argument ? chroma[property](argument)() : chroma[property]()
        const fullMatch = argument ? `${match}:${argument}` : match
        expect(out.join(' ').indexOf(fullMatch)).not.toBe(-1)
      })
    }
    const styleString = 'text-transform:uppercase;margin-bottom:3rem'

    it(`.style("${styleString}")`, () => {
      const out = chroma.style(styleString)()
      expect(out.join(' ').indexOf(styleString)).not.toBe(-1)
    })
  })

  describe('barrier detection', () => {
    it('includes no color clear by default', () => {
      const result = chroma.red(
        'red text',
        chroma.blue('blue text'),
      )
      expect(result[0].indexOf('%c%s ')).toBe(0)
      expect(result.indexOf('')).toBe(-1)
    })

    it('includes a barrier after padding', () => {
      const result = chroma.padding('5px')(
        'padded text',
        chroma.blue('blue text'),
      )
      expect(result[0].indexOf('%c%s%c ')).toBe(0)
      expect(result.indexOf('')).toBe(3)
    })

    it('includes a barrier after text-decoration', () => {
      const result = chroma.red(
        'padded text',
        chroma.strike,
        'strike text',
        chroma.blue,
        'blue text',
      )
      expect(result[0]).toBe('%c%s %c%s%c %c%s ')
      expect(result.indexOf('')).toBe(5)
    })
  })

  describe('behavior', () => {
    it('will not execute non-chroma functions in the arguments', () => {
      const log = spyOn(console, 'log').mockImplementation(() => {})
      const fn = mock(() => {})
      chroma.red.log('hello', fn, 'world')

      expect(fn).not.toHaveBeenCalled()
      log.mockRestore()
    })
  })
})
