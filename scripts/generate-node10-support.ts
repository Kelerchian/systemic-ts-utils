import * as fs from "node:fs/promises";
import * as path from "node:path";

(async () => {
  const rootPath = path.resolve(".");
  const packageJsonPath = path.resolve(rootPath, "package.json");
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  const exports = packageJson?.tshy?.exports;
  if (!exports) throw new Error("tshy.exports undefined");

  const subpaths = Object.entries(exports);
  const pathConfigs = subpaths
    .filter(([key, _]) => {
      return key !== "." && key !== "./package.json";
    })
    .map(([key, value]) => {
      const sourcePathParsed = path.parse(value as string);
      return {
        pathExtless: path.relative(
          "./src",
          path.join(sourcePathParsed.dir, sourcePathParsed.name),
        ),
        supportDirPath: path.resolve(rootPath, key),
      };
    });

  const tasks = pathConfigs.map((p) => async () => {
    const toRoot = path.relative(p.supportDirPath, rootPath); // should be ".."
    await fs.mkdir(p.supportDirPath, {
      recursive: true,
    });
    await fs.writeFile(
      path.join(p.supportDirPath, "package.json"),
      JSON.stringify(
        {
          main: `${toRoot}/dist/commonjs/${p.pathExtless}.js`,
          module: `${toRoot}/dist/esm/${p.pathExtless}.js`,
          typings: `${toRoot}/dist/commonjs/${p.pathExtless}.d.ts`,
        },
        null,
        2,
      ),
      "utf8",
    );
  });

  for (const task of tasks) {
    await task();
  }

  const oldPackageJsonFiles = new Set<string>(packageJson.files);
  pathConfigs.forEach((p) => oldPackageJsonFiles.add(p.pathExtless));
  packageJson.files = Array.from(oldPackageJsonFiles);

  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2),
    "utf8",
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
