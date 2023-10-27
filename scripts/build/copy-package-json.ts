import * as fs from "fs";

export namespace Paths {
  export const packageJsonCjsPatch = "./package.cjs.patch.json";
  export const packageJsonEsmPatch = "./package.esm.patch.json";
  export const packageJsonCjs = "./dist/cjs/package.json";
  export const packageJsonEsm = "./dist/esm/package.json";
}

fs.copyFileSync(Paths.packageJsonCjsPatch, Paths.packageJsonCjs);
fs.copyFileSync(Paths.packageJsonEsmPatch, Paths.packageJsonEsm);
