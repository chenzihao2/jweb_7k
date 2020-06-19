import * as Http from 'http'
import * as Path from 'path'
import * as util from 'util'
import * as querystring from 'querystring'

import * as formidable from 'formidable'

import Request, { NO_BODY_REQUESTS } from '../request'
import Response from '../response'

export function setCorsHeader (req: Http.IncomingMessage, res: Http.ServerResponse, options: any) {

}

export default function httpParser (req: Http.IncomingMessage, res: Http.ServerResponse, options: any, success: any, fail: any) {
  setCorsHeader(req, res, options)
  const request = new Request(req, res)
  const response = new Response(req, res)

  const hasBody = NO_BODY_REQUESTS.indexOf(request.method) < 0
  let form: formidable.IncomingForm = null
  if (hasBody) {
    form = this.processFormData(req, res)
  }

  if (hasBody) {
    success && success(request, response)
  } else {
    success && success(request, response)
  }
}

function processFormData (request: Http.IncomingMessage, response: Http.ServerResponse): formidable.IncomingForm {
  const form = new formidable.IncomingForm()
  form.parse(request, function(err, fields: formidable.Fields, files: formidable.Files) {
  })
  form.on('file', function(name, file: formidable.File) {
  })
  form.on('progress', function(bytesReceived, bytesExpected) {
  })
  form.on('field', function(name, value) {
  })
  return form
}