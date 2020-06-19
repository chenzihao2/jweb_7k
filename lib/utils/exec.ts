import * as child_process from 'child_process'

export function exec (cmd: string, checkErrorEmpty?: boolean): Promise<any> {
  return new Promise((resolve, reject) => {
    child_process.exec(cmd, function (err, out, stderr) {
      if (err) {
        if (checkErrorEmpty && err.code === 1 && !stderr) {
        } else {
          reject({err: err.code, message: JSON.stringify(stderr)})
          return
        }
      }
      resolve({err: null, data: out, message: null})
    })
  })
}