export interface Request {
  url: string
  path: string
  payload: any
  query: any
  params: any
  paramsArray: any
  headers: any
  cookies: any
  entity: any
  innerParams: {}

  append (data: any): void
  setData (data: any): void
  getData (key?: string): any
  getNum (key: string, defaultValue?: number): number
  getString (key: string, defaultValue?: string): string
  getBool (key: string, defaultValue?: boolean): boolean
  getParam (key: string, defaultValue?: any): any
}

export interface Response {
  append (data: any): void
  setData (data: any): void
  getData (key?: string): any
  write (data: any): void
  flush (): void
  writeAndFlush (data: any): void
  redirect (url: string, code?: number): void
  writeHeader (code: number, reason?: string)
  setHeader (name: string, value: any): void
  type (mimeType: string): void
  setCookie (name: string, value: object | string, options?: any): void
  delCookie (name: string, options?: any): void
  error(message?: string): void
}
