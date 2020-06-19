export function format (template: string, params: any, delimiter?: string): string
export function xmlEncode(ret: any): string
export function jsonEncode(ret: any): string
export function exec (cmd: string, checkErrorEmpty?: boolean): Promise<any>
export function msleep(n: number): void
export function sleep(n: number): void