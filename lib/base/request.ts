import * as Http from 'http'
import * as querystring from 'querystring'
import * as formidable from 'formidable'

import ReqRes from './reqres'

export const HTTP_METHODS = {
  get: 'get',
  head: 'head',
  post: 'post',
  put: 'put',
  delete: 'delete',
  connect: 'connect',
  options: 'options',
  trace: 'trace',
  patch: 'patch'
}

export const NO_BODY_REQUESTS = [
  HTTP_METHODS.get,
  HTTP_METHODS.head,
  HTTP_METHODS.delete,
  HTTP_METHODS.options
]

export default class Request extends ReqRes {

  public method: string
  public url: string
  public path: string
  public payload
  public query
  public params
  public paramsArray
  public headers
  public cookies
  public entity: any
  public innerParams: {}

  private request: Http.IncomingMessage
  private response: Http.ServerResponse

  constructor (request: Http.IncomingMessage, response: Http.ServerResponse) {
    super()

    this.method = request.method.toLowerCase()
    const url: string = request.url || '/'
    const queryStartPos = url.indexOf('?')
    let path: string = url, queryParams = null
    if (queryStartPos >= 0) {
      path = url.substr(0, queryStartPos)
      queryParams = querystring.decode(url.substr(queryStartPos + 1))
    }

    this.url = request.headers.host + request.url
    this.path = request.url
    // this.payload = request.payload
    // this.query = request.query
    // this.params = request.params
    // this.paramsArray = request.paramsArray
    this.headers = request.headers
    // this.cookies = request.state

    this.request = request
    this.response = response
  }

  public getParam (key: string, defaultValue?: any): any {
    if (this.params && typeof this.params[key] !== 'undefined') {
      return this.params[key]
    }
    if (this.query && typeof this.query[key] !== 'undefined') {
      return this.query[key]
    }
    if (this.payload && typeof this.payload[key] !== 'undefined') {
      return this.payload[key]
    }
    return defaultValue || null
  }

  public getNum (key: string, defaultValue?: number): number {
    const val = this.getParam(key, defaultValue)
    if (val === null) {
      return defaultValue || null
    }
    if (!val) {
      return 0
    }
    return val - 0
  }

  public getString (key: string, defaultValue?: string): string {
    const val = this.getParam(key, defaultValue)
    if (val === null) {
      return defaultValue || null
    }
    return String(val)
  }

  public getBool (key: string, defaultValue?: boolean): boolean {
    const val = this.getParam(key, defaultValue)
    if (val === null) {
      return defaultValue || null
    }
    return Boolean(val)
  }

}
