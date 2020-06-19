export class BaseController {
  constructor()

  template (name: string, fileName: string, data?: object, options?: object): void
  templateValue (name: string, value: any): void
  templateValues (data: object): void

  show (fileName: string, contentKey?: string, withoutDefaultLayoutDir?: boolean): string
}
