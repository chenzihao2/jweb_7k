export function Validation (entityClz: Function, mode?: ValidationMode | string)
export function ValidationScene (...scenes)

export function Between(min: number, max: number, message?: string)
export function Email(message?: string | any, options?: any)
export function Max(max: number, message?: string)
export function Min(min: number, message?: string)
export function Size(min: number, max?: number | string, message?: string)
export function Regex(tester: string, message?: string)
export function Required(message?: Function | string | any, options?: any)

export enum ValidationMode {
  params,
  entity
}