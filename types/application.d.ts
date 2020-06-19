import { EventEmitter } from "events"

export class Application extends EventEmitter {
  constructor()

  readonly cmdArgs: any

  readonly root: string
  readonly resource: string

  readonly configNS: string
  readonly controllerDir: string
  readonly viewDir: string
  readonly tplExt: string
  readonly taskDir: string

  readonly applicationType: ApplicationType
  readonly applicationConfigs: any

  static getIns (): Application
  static start (options?: object): Promise<Application>
  route (option: object): Application
  getAppConfigs (): any
  getApplicationConfigs (key?: string): any
}

export enum AppErrorEvent {
  REQUEST
}

export enum ApplicationType {
  web,
  task
}