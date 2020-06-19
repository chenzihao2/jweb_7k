import * as Http from 'http'
import * as Path from 'path'
import * as util from 'util'
import * as querystring from 'querystring'
import * as formidable from 'formidable'

import * as Hapi from "@hapi/hapi"
import * as Inert from "@hapi/inert"
import * as YAML from 'yaml'
import { EventEmitter } from "events"

import { BeanFactory, getApplicationConfigs, isAsyncFunction, merge, ReflectHelper, registerConfigParser, checkSupportTransition, emitBegin, emitCommit, emitRollback } from 'jbean'
import starters from './starters'
import { exec, sleep } from './utils'
import Router from './base/router'

const defaultOptions = {
  port: 3000,
  host: 'localhost',

  configNS: 'node-web',
  controllerDir: 'controller',
  viewDir: 'view',
  tplExt: 'html',

  taskDir: 'task'
}

const TASK_ARG_KEY = {
  task: 't',
  loop: 'l',
  sleep: 's'
}

export enum AppErrorEvent {
  REQUEST = 'error_request',
  NOT_FOUND = '404'
}

export enum ApplicationType {
  web,
  task
}

const taskMethod = 'process'

registerConfigParser('yml', function (content: any) {
  if (!content) {
    return null
  }
  return YAML.parse(content)
})

export default class Application extends EventEmitter {

  private static ins: Application

  public isDev: boolean = process.env.NODE_ENV === 'development'

  private appOptions: any = {}
  public applicationConfigs = {}

  public cmdArgs = {}

  public root: string
  public assets: string

  public configNS: string
  public controllerDir: string
  public viewDir: string
  public tplExt: string
  public taskDir: string

  private taskScript: string

  public applicationType: ApplicationType

  private server: Hapi.Server

  constructor () {
    super()
  }

  private static create (options?: object): Application {
    const ins = Application.ins = new Application()
    ins.appOptions = {}
    merge(ins.appOptions, defaultOptions)
    merge(ins.appOptions, options)
    ins.configNS = ins.appOptions.configNS
    ins.applicationConfigs = getApplicationConfigs()
    return ins
  }

  public static getIns (): Application {
    return Application.ins
  }

  public static async start (options?: object): Promise<Application> {
    BeanFactory.initBean()

    const application = Application.create(options)
    application.registerExit()
    application.init()

    BeanFactory.startBean()
    if (application.isDev) {
      console.log('Starting at dev enviroment')
    }
    try {
      await starters(application)

      switch (application.applicationType) {
        case ApplicationType.web:
          await application.runWebServer()
          break
        case ApplicationType.task:
          await application.runTask()
          break
        default:
          break
      }
    } catch (e) {
      console.error(e)
    }

    return application
  }

  public getAppConfigs (): any {
    return this.getApplicationConfigs('app')
  }

  public getApplicationConfigs (key?: string): any {
    if (typeof this.applicationConfigs[this.configNS] === 'undefined'
        || typeof this.applicationConfigs[this.configNS].app === 'undefined') {
      return {}
    }
    const appConfigs = this.applicationConfigs[this.configNS]
    return key ? appConfigs[key] : appConfigs
  }

  private parseCmdArgs (): void {
    const args: string[] = process.argv
    if (args.length < 3) {
      return
    }
    let argName = null
    for (let i = 2; i < args.length; i++) {
      if (args[i].substr(0, 1) === '-') {
        argName = args[i].replace(/^\-*/g, '')
      } else {
        if (argName) {
          Object.keys(TASK_ARG_KEY).forEach(key => {
            if (key === argName) {
              argName = TASK_ARG_KEY[key]
            }
          })
          this.cmdArgs[argName] = args[i].replace(/^\-*/g, '')
        }
        argName = null
      }
    }
  }

  private checkAppType (): void {
    if (typeof this.cmdArgs[TASK_ARG_KEY.task] !== 'undefined') {
      this.applicationType = ApplicationType.task
    } else {
      this.applicationType = ApplicationType.web
    }
  }

  private bindEvent (): void {
    this.on(AppErrorEvent.REQUEST, err => {
      console.error("Request error: ", err)
    })
  }

  public init (): void {
    this.root = Path.dirname(require.main.filename)
    this.parseCmdArgs()
    this.checkAppType()

    this.bindEvent()

    switch (this.applicationType) {
      case ApplicationType.web:
        this.initWebServer()
        break
      case ApplicationType.task:
        this.initTask()
        break
      default:
        break
    }
  }

  private initWebServer (): void {
    const appConfigs = this.getAppConfigs()
    this.server = new Hapi.Server({
      port: appConfigs.port || defaultOptions.port,
      host: appConfigs.host || defaultOptions.host,
      state: {
        strictHeader: false
      }
    })

    if (typeof appConfigs.assets !== 'undefined') {
      this.assets = appConfigs.assets
      if (!Path.isAbsolute(this.assets)) {
        this.assets = Path.join(Path.dirname(this.root), this.assets)
      }
    }

    this.controllerDir = appConfigs.controllerDir || defaultOptions.controllerDir
    if (process.env.NODE_ENV === 'development') {
      this.viewDir = Path.join(Path.dirname(Path.dirname(this.root)), 'src', appConfigs.viewDir || defaultOptions.viewDir)
    } else {
      this.viewDir = appConfigs.viewDir || defaultOptions.viewDir
    }
    this.tplExt = appConfigs.tplExt || defaultOptions.tplExt
  }

  private initTask () {
    let taskScript: string = this.cmdArgs[TASK_ARG_KEY.task]
    const appConfigs = this.getAppConfigs()
    this.taskDir = appConfigs.taskDir || defaultOptions.taskDir
    if (taskScript.substr(0, 1) === '/') {
      this.taskScript = Path.join(this.root, taskScript)
    } else {
      this.taskScript = Path.join(this.root, this.taskDir, taskScript)
    }
  }

  public async runWebServer () {

    var callProcess = async function (req: Http.IncomingMessage, res: Http.ServerResponse) {
      var form = new formidable.IncomingForm()
      console.log(req.method)
      console.log(req.url)
      console.log(req.headers.host)
      form.parse(req, function(err, fields: formidable.Fields, files: formidable.Files) {
        // console.log(fields)
        console.log(files)
        if (fields['a']) {
          // console.log('start sleep', +(new Date))
          // sleep(5)
          // console.log('end sleep', +(new Date))
          setTimeout(() => {
            res.writeHead(200, {'content-type': 'text/plain'})
            res.write('set timeout\n\n')
            // res.end()
            res.end(util.inspect({fields: fields, files: files}))
          }, 3000)
        } else {
          res.writeHead(200, {'content-type': 'text/plain'})
          res.write('received\n\n')
          // res.end()
          res.end(util.inspect({fields: fields, files: files}))
        }
      })
      form.on('file', function(name, file: formidable.File) {
        console.log(name, '====')
        // console.log(file, '00000')
      })
      form.on('progress', function(bytesReceived, bytesExpected) {
        // console.log(bytesReceived, '------')
      })
      form.on('field', function(name, value) {
        // console.log(name, value)
      })
    }

    Http.createServer(function (req: Http.IncomingMessage, res: Http.ServerResponse) {
      // callProcess(req, res)
      Router.dispatch(req, res)
    }).listen(8080)
    return

    await this.server.register(Inert)
    if (this.assets) {
      this.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
          directory: {
            path: this.assets,
            redirectToSlash: false,
            index: true,
          }
        }
      })
    }
    await this.server.start()
    console.log(`Server running at: ${this.server.info.uri}`)
  }

  public async runTask () {
    //const scriptFile = require.main.filename
    const entryFile = process.argv[1]
    let args = process.argv.slice(2).join(' ')
    if (args.startsWith('-')) {
      args = '\\' + args
    }
    const cmd = 'ps aux | grep \'' + entryFile + '\' | grep -v grep | grep -v \'/bin/sh \\-c\' | grep \'' + args + '\''
    let { err, data, message } = await exec(cmd, true)
    if (err) {
      console.error(message)
      process.emit('exit', 0)
      return
    }
    data = data.replace(/^\s*|\s*$/g, '')
    data = data.split("\n")
    if (data.length > 1) {
      process.emit('exit', 0)
      return
    }

    let task = require(this.taskScript)
    if (task.default) {
      task = task.default
    }
    if (typeof task !== 'function') {
      console.error('typeof ' + this.taskScript + ' is not class.')
      process.emit('exit', 0)
      return
    }
    const methods: string[] = ReflectHelper.getMethods(task)
    if (methods.indexOf(taskMethod) < 0) {
      console.error(taskMethod + ' method of ' + task.name + ' is not exist.')
      process.emit('exit', 0)
      return
    }

    let sleepSeconds = this.cmdArgs[TASK_ARG_KEY.sleep] || 0
    let loopTimes = this.cmdArgs[TASK_ARG_KEY.loop] || 1
    if (sleepSeconds < 0) {
      sleepSeconds = 0
    }
    if (loopTimes < 1) {
      loopTimes = 1
    }

    const taskIns = new task()
    for (let i = 0; i < loopTimes; i++) {
      if (checkSupportTransition(task, taskMethod)) {
        BeanFactory.genRequestId(taskIns)
      }
      const requestId = BeanFactory.getRequestId(taskIns)
      try {
        if (requestId) {
          await emitBegin(requestId)
        }
        const args = {}
        Object.assign(args, this.cmdArgs)
        Object.keys(TASK_ARG_KEY).forEach(k => {
          delete args[TASK_ARG_KEY[k]]
        })
        await taskIns[taskMethod](this, args)
        if (requestId) {
          await emitCommit(requestId)
          await BeanFactory.releaseBeans(requestId)
        }
      } catch (e) {
        if (requestId) {
          await emitRollback(requestId)
          await BeanFactory.releaseBeans(requestId)
        }
        console.error(e)
        process.emit('exit', 0)
        return
      }
      if (sleepSeconds > 0) {
        sleep(sleepSeconds)
      }
    }
    process.emit('exit', 0)
  }

  public route (option: any): Application {
    if (this.applicationType !== ApplicationType.web) {
      return this
    }
    const appConfig = this.getAppConfigs()
    if (appConfig && appConfig.cors) {
      option.options = {
        // cors: true
        cors: {
          origin: ['*'],
          maxAge: 86400,
          credentials: true
        }
      }
    }
    this.server.route(option)
    return this
  }

  public registerExit (): void {
    let exitHandler = function (options, code) {
      if (options && options.exit) {
        if (this.applicationType !== ApplicationType.task) {
          console.log('application exit at', code)
        }
        BeanFactory.destroyBean()
        process.exit(code)
      } else {
        console.error('exception', code)
      }
    }

    process.on('exit', exitHandler.bind(this, {exit: true}))

    // catch ctrl+c event
    process.on('SIGINT', exitHandler.bind(this, {exit: true}))

    // catch "kill pid"
    process.on('SIGUSR1', exitHandler.bind(this, {exit: true}))
    process.on('SIGUSR2', exitHandler.bind(this, {exit: true}))

    // catch uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(this, {exit: false}))
  }
}
