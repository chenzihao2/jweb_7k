import * as Http from 'http'
import * as Path from 'path'
import * as util from 'util'
import * as querystring from 'querystring'

import * as formidable from 'formidable'
import * as pathToRegexp from 'path-to-regexp'

import Request, { HTTP_METHODS } from './request'
import Response from './response'
import httpParser, { setCorsHeader } from './http/httpparser'

const StaticPaths = {}
const RegPatternPaths = {
  pp: {}, // with path prefix
  others: {}
}

export default class Router {

  public static dispatch (req: Http.IncomingMessage, res: Http.ServerResponse) {
    const method: string = req.method.toLowerCase()
    const path: string = (req.url || '/').split('?')[0]
    const {handler, args, pathParams, options, firstPath} = Router.getRouterHandler(method, path)
    if (!handler) {
      if (method === HTTP_METHODS.options) {
        setCorsHeader(req, res, options)
      }
      // emit 404
      res.end()
    } else {
      httpParser(req, res, options, function (request: Request, response: Response) {
        const out = handler(request, response, method, path, args, pathParams)
        if (out === null) {
          return
        }
        if (!out) {
          res.end()
        } else {
          const outType = typeof out
          if (outType === 'boolean' || outType === 'string' || outType === 'number') {
            res.end(out)
          } else if (outType === 'object') {
            if (out.toString() !== '[object Promise]') {
              res.end(JSON.stringify(out))
            } else {
              out.then((data: any) => {
                const dataType = typeof out
                if (dataType === 'boolean' || dataType === 'string' || dataType === 'number') {
                  res.end(data)
                } else {
                  res.end(JSON.stringify(data))
                }
              }).catch((err) => {
                // TODO 500
                res.end(JSON.stringify(err))
              })
            }
          } else {
            res.end()
          }
        }
      }, function (request: Request, response: Response, error: any) {
      })
    }
  }

  private static getRouterHandler (method: string, path: string): {handler, args, pathParams, options, firstPath} {
    const [firstPath, pathLen, pathLenKey] = Router.getFirstPathAndLen(path)
    const routerHandler = {
      handler: null,
      args: null,
      pathParams: null,
      options: null,
      firstPath: firstPath
    }

    // StaticPaths struct: method => len => firstPath => path
    // pathHandler struct: {handler, args, options}
    if (StaticPaths[method] && StaticPaths[method][firstPath]
        && StaticPaths[method][firstPath][pathLenKey]
        && StaticPaths[method][firstPath][pathLenKey][path]) {
      const pathHandler = StaticPaths[method][firstPath][pathLenKey][path]
      routerHandler.handler = pathHandler['handler']
      routerHandler.args = pathHandler['args']
      routerHandler.options = pathHandler['options']
      return routerHandler
    }

    let match = null, pathHandler = null
    if (RegPatternPaths.pp[method] && RegPatternPaths.pp[method][firstPath]) {
      const pathHandlers = RegPatternPaths.pp[method][firstPath]
      for (let i = 0; i < pathHandlers.length; i++) {
        const {reg} = pathHandlers[i]
        if (!reg || typeof reg['exec'] !== 'function') {
          continue
        }
        match = reg.exec(path)
        if (match) {
          pathHandler = pathHandlers[i]
        }
      }
    }
    if (!match && RegPatternPaths.others[method]) {
      const pathHandlers = RegPatternPaths.others[method]
      for (let i = 0; i < pathHandlers.length; i++) {
        const {reg} = pathHandlers[i]
        if (!reg || typeof reg['exec'] !== 'function') {
          continue
        }
        match = reg.exec(path)
        if (match) {
          pathHandler = pathHandlers[i]
        }
      }
    }
    if (match) {
      routerHandler.pathParams = {}
      for (let j = 0; j < pathHandler.keys.length; j++) {
        routerHandler.pathParams[pathHandler.keys[j]] = match[j + 1]
      }
      routerHandler.handler = pathHandler.handler
      routerHandler.args = pathHandler.args
      routerHandler.options = pathHandler.options
    }

    return routerHandler
  }

  public static add (method: string, path: string, handler: Function, args?: any, options?: object) {
    method = method.toLowerCase()
    path = path || '/'
    const [firstPath, pathLen, pathLenKey] = Router.getFirstPathAndLen(path)

    const routerHandler = {
      handler: handler,
      args: args,
      options: options,
      reg: null,
      keys: null
    }

    const tokens = pathToRegexp.parse(path)
    let isStaticPath = true
    for (let i = 0; i < tokens.length; i++) {
      if (typeof tokens[i] !== 'string') {
        isStaticPath = false
      }
    }
    if (isStaticPath) {
      if (typeof StaticPaths[method] === 'undefined') {
        StaticPaths[method] = {}
      }
      if (typeof StaticPaths[method][firstPath] === 'undefined') {
        StaticPaths[method][firstPath] = {}
      }
      if (typeof StaticPaths[method][firstPath][pathLenKey] === 'undefined') {
        StaticPaths[method][firstPath][pathLenKey] = {}
      }
      StaticPaths[method][firstPath][pathLenKey][path] = routerHandler
    } else {
      let patternPaths = null
      if (typeof tokens[0] === 'string') {
        if (typeof RegPatternPaths.pp[method] === 'undefined') {
          RegPatternPaths.pp[method] = {}
        }
        if (typeof RegPatternPaths.pp[method][firstPath] === 'undefined') {
          RegPatternPaths.pp[method][firstPath] = []
        }
        patternPaths = RegPatternPaths.pp[method][firstPath]
      } else {
        if (typeof RegPatternPaths.others[method] === 'undefined') {
          RegPatternPaths.others[method] = []
        }
        patternPaths = RegPatternPaths.others[method]
      }
      const keys = []
      routerHandler.reg = pathToRegexp(path, keys)
      routerHandler.keys = keys
      patternPaths.push(routerHandler)

      // sort by options and repeat
      const s1 = [], s2 = [], s3 = [], s4 = []
      for (let i = 0; i < patternPaths.length; i++) {
        let optional = false, repeat = false
        for (let j = 0; j < patternPaths[i].keys.length; j++) {
          if (typeof patternPaths[i].keys[j] !== 'string') {
            optional = optional || patternPaths[i].keys[j].optional
            repeat = optional || patternPaths[i].keys[j].repeat
          }
        }
        if (!optional && !repeat) {
          s1.push(patternPaths[i])
        } else if (!optional && repeat) {
          s2.push(patternPaths[i])
        } else if (optional && !repeat) {
          s3.push(patternPaths[i])
        } else {
          s4.push(patternPaths[i])
        }
      }
      const patternPaths2 = s1.concat(s2, s3, s4)
      for (let i = 0; i < patternPaths.length; i++) {
        patternPaths[i] = patternPaths2[i]
      }
    }
  }

  private static getFirstPathAndLen (path: string) {
    path = path || '/'
    if (path === '/') {
      return [path, 1, 'p1']
    } else {
      const pathParts = path.split('/')
      let pathLen = pathParts.length
      let firstPath = pathParts[0]
      if (!firstPath && pathLen > 1) {
        firstPath = pathParts[1]
        pathLen--
      }
      return [firstPath, pathLen, 'p' + pathLen]
    }
  }

}