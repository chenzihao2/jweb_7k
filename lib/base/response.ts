import * as Http from 'http'

import ReqRes from './reqres'

export default class Response extends ReqRes {

  public static primaryTypes = ['boolean', 'number', 'string']

  private request: Http.IncomingMessage
  private response: Http.ServerResponse

  constructor (request: Http.IncomingMessage, response: Http.ServerResponse) {
    super()
    this.request = request
    this.response = response
  }

  public write (data: any): void {
    if (data === null || data === undefined) {
      return
    }
    if (typeof data !== 'string') {
      data = JSON.stringify(data)
    }
    this.response.write(data)
  }

  public flush (): void {
    this.response.end()
  }

  public writeAndFlush (data?: any): void {
    this.write(data)
    this.flush()
  }

  public redirect (url: string, code?: number): void {
    if (code === undefined) {
      code = 302
    }
    this.response.writeHead(code, {
      Location: url
    })
    this.flush()
  }

  public writeHeader (code: number, reason?: string) {
    this.response.writeHead(code, reason)
  }

  public setHeader (name: string, value: any): void {
    this.response.setHeader(name, value)
  }

  public type (mimeType: string): void {
    this.setHeader('Content-Type', mimeType)
  }

  public setCookie (name: string, value: object | string, options?: any): void {
    // this.response.response().state(name, value, options)
  }

  public delCookie (name: string, options?: any): void {
    // this.response.response().unstate(name, options)
  }

  public error(message?: string): void {
    this.writeHeader(500, message)
    this.flush()
  }

}
