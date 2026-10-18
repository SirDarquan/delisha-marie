#!/usr/bin/env node
// Idempotent patch for Chokidar and @angular/build watcher in Docker/WSL2 polling mode.
//
// When `--poll` is enabled on a Windows-mounted workspace (9p/drvfs), @angular/build's
// ChokidarNodeModulesManager strips `**/node_modules/**` from the ignore list and adds
// every imported package folder into Chokidar polling (40,000+ files), hanging `ng serve`
// and causing `vercel dev` to time out.
//
// This script patches both:
// 1. `node_modules/chokidar/index.js` (`FSWatcher.prototype._isIgnored` & `add`) so the
//    fix survives even if `@angular/build` refactors `watcher.js` in future Angular updates.
// 2. `node_modules/@angular/build/src/utils/watcher.js` so `ChokidarNodeModulesManager`
//    skips registering `node_modules` packages when polling is active.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PATCH_MARKER = '/* @dm-poll-ignore-patched */';

function patchChokidar() {
  const file = path.join(ROOT, 'node_modules', 'chokidar', 'index.js');
  if (!fs.existsSync(file)) return false;

  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(PATCH_MARKER)) return false;

  const ignoreTarget = '    _isIgnored(path, stats) {';
  const ignoreReplacement = [
    `    _isIgnored(path, stats) { ${PATCH_MARKER}`,
    '        if (this.options.usePolling && /(?:^|[\\\\/])(?:node_modules|dist|coverage|\\.(?:git|angular|agents|devcontainer|github|husky|vscode|vercel))(?:[\\\\/]|$)/.test(path)) return true;',
  ].join('\n');

  const addTarget = '    add(paths_, _origAdd, _internal) {';
  const addReplacement = [
    `    add(paths_, _origAdd, _internal) { ${PATCH_MARKER}`,
    '        if (this.options.usePolling && !_internal) {',
    "            paths_ = (Array.isArray(paths_) ? paths_.flat() : [paths_]).filter((p) => typeof p !== 'string' || !/(?:^|[\\\\/])node_modules(?:[\\\\/]|$)/.test(p));",
    '            if (paths_.length === 0) return this;',
    '        }',
  ].join('\n');

  let updated = content;
  if (updated.includes(ignoreTarget)) {
    updated = updated.replace(ignoreTarget, ignoreReplacement);
  }
  if (updated.includes(addTarget)) {
    updated = updated.replace(addTarget, addReplacement);
  }

  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    return true;
  }
  return false;
}

function patchAngularWatcher() {
  const file = path.join(ROOT, 'node_modules', '@angular', 'build', 'src', 'utils', 'watcher.js');
  if (!fs.existsSync(file)) return false;

  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(PATCH_MARKER)) return false;

  // If already patched earlier without marker, add marker to avoid duplicate work
  if (content.includes('this.watchNodeModules = watchNodeModules;')) {
    fs.writeFileSync(file, `${PATCH_MARKER}\n${content}`, 'utf8');
    return true;
  }

  let updated = content;

  // 1. Prune .git, .angular, dist, coverage, node_modules, and dot-directories in setupWatcher
  const setupTarget = [
    '    const ignored = [',
    '        // Ignore the output and cache paths to avoid infinite rebuild cycles',
    '        normalizedOutputBase,',
    '        `${normalizedOutputBase}/**`,',
    '        normalizedCacheBase,',
    '        `${normalizedCacheBase}/**`,',
    '        `${(0, path_1.toPosixPath)(workspaceRoot)}/**/.*/**`,',
    '    ];',
  ].join('\n');

  const setupReplacement = [
    '    const normalizedWorkspaceRoot = (0, path_1.toPosixPath)(workspaceRoot);',
    '    const ignored = [',
    '        // Ignore the output and cache paths to avoid infinite rebuild cycles',
    '        normalizedOutputBase,',
    '        `${normalizedOutputBase}/**`,',
    '        normalizedCacheBase,',
    '        `${normalizedCacheBase}/**`,',
    '        `${normalizedWorkspaceRoot}/.git`,',
    '        `${normalizedWorkspaceRoot}/.angular`,',
    '        `${normalizedWorkspaceRoot}/dist`,',
    '        `${normalizedWorkspaceRoot}/coverage`,',
    '        `${normalizedWorkspaceRoot}/node_modules`,',
    '        `${normalizedWorkspaceRoot}/**/.*`,',
    '        `${normalizedWorkspaceRoot}/**/.*/**`,',
    '    ];',
  ].join('\n');

  if (updated.includes(setupTarget)) {
    updated = updated.replace(setupTarget, setupReplacement);
  }

  // 2. Skip node_modules package registration when polling is enabled
  const managerTarget = '    const nodeModulesManager = new ChokidarNodeModulesManager(isCaseSensitive);';
  const managerReplacement =
    '    const nodeModulesManager = new ChokidarNodeModulesManager(isCaseSensitive, !(options?.polling && !options?.followSymlinks));';

  if (updated.includes(managerTarget)) {
    updated = updated
      .replace(
        'class ChokidarNodeModulesManager {\n    isCaseSensitive;\n    allowedPackages = new Map();\n    constructor(isCaseSensitive) {\n        this.isCaseSensitive = isCaseSensitive;\n    }',
        'class ChokidarNodeModulesManager {\n    isCaseSensitive;\n    watchNodeModules;\n    allowedPackages = new Map();\n    constructor(isCaseSensitive, watchNodeModules = true) {\n        this.isCaseSensitive = isCaseSensitive;\n        this.watchNodeModules = watchNodeModules;\n    }',
      )
      .replace(
        '        if (!packageDir) {\n            return { isPackage: false };\n        }',
        '        if (!packageDir) {\n            return { isPackage: false };\n        }\n        if (!this.watchNodeModules) {\n            return { isPackage: true };\n        }',
      )
      .replace(
        '        if (!filePath.includes(NODE_MODULES)) {\n            return false;\n        }',
        '        if (!filePath.includes(NODE_MODULES)) {\n            return false;\n        }\n        if (!this.watchNodeModules) {\n            return true;\n        }',
      )
      .replace(managerTarget, managerReplacement);
  }

  if (updated !== content) {
    fs.writeFileSync(file, `${PATCH_MARKER}\n${updated}`, 'utf8');
    return true;
  }
  return false;
}

function patchAngularVitestPlugin() {
  const file = path.join(
    ROOT,
    'node_modules',
    '@angular',
    'build',
    'src',
    'builders',
    'unit-test',
    'runners',
    'vitest',
    'plugins.js',
  );
  if (!fs.existsSync(file)) return false;

  const markerV3 = '/* @dm-poll-ignore-patched-v3 */';
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(markerV3)) return false;

  // Upgrade earlier v1 or v2 patches
  const v1Block = [
    `                    isolate: false, ${PATCH_MARKER}`,
    '                    fileParallelism: false,',
    "                    sequence: { setupFiles: 'list' },",
  ].join('\n');

  const v2Block = [
    '                    isolate: false, /* @dm-poll-ignore-patched-v2 */',
    '                    fileParallelism: true,',
    '                    maxWorkers: 4,',
    '                    minWorkers: 2,',
    "                    sequence: { setupFiles: 'list' },",
  ].join('\n');

  const unpatchedBlock =
    "                    isolate: false,\n                    sequence: { setupFiles: 'list' },";

  const replacement = [
    `                    isolate: false, ${markerV3}`,
    '                    fileParallelism: true,',
    '                    maxWorkers: 2,',
    '                    minWorkers: 1,',
    "                    sequence: { setupFiles: 'list' },",
  ].join('\n');

  let updated = content;
  if (updated.includes(v2Block)) {
    updated = updated.replace(v2Block, replacement);
  } else if (updated.includes(v1Block)) {
    updated = updated.replace(v1Block, replacement);
  } else if (updated.includes(unpatchedBlock)) {
    updated = updated.replace(unpatchedBlock, replacement);
  }

  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    return true;
  }
  return false;
}

function patchVitestTimeouts() {
  const chunksDir = path.join(ROOT, 'node_modules', 'vitest', 'dist', 'chunks');
  if (!fs.existsSync(chunksDir)) return false;

  const files = fs
    .readdirSync(chunksDir)
    .filter((f) => f.startsWith('cli-api.') && f.endsWith('.js'));

  let anyPatched = false;
  for (const name of files) {
    const file = path.join(chunksDir, name);
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(PATCH_MARKER)) continue;

    const updated = content
      .replace('const START_TIMEOUT = 6e4;', `const START_TIMEOUT = 3e5; ${PATCH_MARKER}`)
      .replace('const WORKER_START_TIMEOUT = 9e4;', 'const WORKER_START_TIMEOUT = 36e4;');

    if (updated !== content) {
      fs.writeFileSync(file, updated, 'utf8');
      anyPatched = true;
    }
  }
  return anyPatched;
}

function patchNormalizeCache() {
  const file = path.join(
    ROOT,
    'node_modules',
    '@angular',
    'build',
    'src',
    'utils',
    'normalize-cache.js',
  );
  if (!fs.existsSync(file)) return false;

  const marker = '/* @dm-cache-tmp-patched */';
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(marker)) return false;

  const target = "    enabled = !process.versions.webcontainer, environment = 'local', path = '.angular/cache', } = cacheMetadata;";
  const replacement =
    `    enabled = !process.versions.webcontainer, environment = 'local', path = process.platform === 'linux' ? '/tmp/delisha-angular-cache' : '.angular/cache', } = cacheMetadata; ${marker}`;

  if (content.includes(target)) {
    fs.writeFileSync(file, content.replace(target, replacement), 'utf8');
    return true;
  }
  return false;
}

function patchAngularHost() {
  const file = path.join(
    ROOT,
    'node_modules',
    '@angular',
    'build',
    'src',
    'tools',
    'angular',
    'angular-host.js',
  );
  if (!fs.existsSync(file)) return false;

  const marker = '/* @dm-host-snap-patched */';
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(marker)) return false;

  const target =
    'function createAngularCompilerHost(typescript, compilerOptions, hostOptions, packageJsonCache, sourceFileCache) {\n    // Create TypeScript compiler host\n    const host = typescript.createIncrementalCompilerHost(compilerOptions);';

  const replacement = [
    `const dmFs = require('node:fs'); ${marker}`,
    "const dmV8 = require('node:v8');",
    "const DM_HOST_SNAP = '/tmp/dm-ng-host-snap-v1.bin';",
    'let dmHostSnapData = null;',
    'let dmHostSnapDirty = false;',
    'let dmHostSaveTimer = null;',
    'function getDmHostSnap() {',
    '    if (dmHostSnapData) return dmHostSnapData;',
    "    if (process.platform === 'linux') {",
    '        try {',
    '            if (dmFs.existsSync(DM_HOST_SNAP)) {',
    '                dmHostSnapData = dmV8.deserialize(dmFs.readFileSync(DM_HOST_SNAP));',
    '                return dmHostSnapData;',
    '            }',
    '        } catch {}',
    '    }',
    '    dmHostSnapData = { dirs: new Map(), files: new Map() };',
    '    return dmHostSnapData;',
    '}',
    'function scheduleDmHostSnapSave() {',
    "    if (process.platform !== 'linux' || !dmHostSnapDirty || dmHostSaveTimer) return;",
    '    dmHostSaveTimer = setTimeout(() => {',
    '        dmHostSaveTimer = null;',
    '        if (!dmHostSnapDirty || !dmHostSnapData) return;',
    '        dmHostSnapDirty = false;',
    '        try {',
    '            const tmpFile = `${DM_HOST_SNAP}.${process.pid}.${Date.now()}`;',
    '            dmFs.writeFileSync(tmpFile, dmV8.serialize(dmHostSnapData));',
    '            dmFs.renameSync(tmpFile, DM_HOST_SNAP);',
    '        } catch {}',
    '    }, 250);',
    '    dmHostSaveTimer.unref?.();',
    '}',
    'function getDmDirEntries(dir) {',
    '    const snap = getDmHostSnap();',
    '    let entries = snap.dirs.get(dir);',
    '    if (entries !== undefined) return entries;',
    '    try {',
    '        entries = new Set(dmFs.readdirSync(dir));',
    '    } catch {',
    '        entries = null;',
    '    }',
    '    snap.dirs.set(dir, entries);',
    '    dmHostSnapDirty = true;',
    '    scheduleDmHostSnapSave();',
    '    return entries;',
    '}',
    'function createAngularCompilerHost(typescript, compilerOptions, hostOptions, packageJsonCache, sourceFileCache) {',
    '    // Create TypeScript compiler host',
    '    const host = typescript.createIncrementalCompilerHost(compilerOptions);',
    "    if (process.platform === 'linux') {",
    '        if (!compilerOptions.preserveSymlinks) {',
    '            host.realpath = (p) => p;',
    '        }',
    '        const origFileExists = host.fileExists.bind(host);',
    '        const origDirExists = host.directoryExists.bind(host);',
    '        const origReadFile = host.readFile.bind(host);',
    '        host.fileExists = (fileName) => {',
    "            if (fileName.includes('/node_modules/')) {",
    "                const slashIdx = fileName.lastIndexOf('/');",
    '                if (slashIdx > 0) {',
    '                    const entries = getDmDirEntries(fileName.slice(0, slashIdx));',
    '                    return entries !== null && entries.has(fileName.slice(slashIdx + 1));',
    '                }',
    '            }',
    '            return origFileExists(fileName);',
    '        };',
    '        host.directoryExists = (dirName) => {',
    "            if (dirName.includes('/node_modules')) {",
    '                const clean = dirName.endsWith("/") && dirName.length > 1 ? dirName.slice(0, -1) : dirName;',
    '                return getDmDirEntries(clean) !== null;',
    '            }',
    '            return origDirExists(dirName);',
    '        };',
    '        host.readFile = (fileName) => {',
    "            if (fileName.includes('/node_modules/')) {",
    '                const snap = getDmHostSnap();',
    '                if (snap.files.has(fileName)) return snap.files.get(fileName);',
    '                const text = origReadFile(fileName);',
    '                snap.files.set(fileName, text);',
    '                dmHostSnapDirty = true;',
    '                scheduleDmHostSnapSave();',
    '                return text;',
    '            }',
    '            return origReadFile(fileName);',
    '        };',
    '    }',
  ].join('\n');

  if (content.includes(target)) {
    fs.writeFileSync(file, content.replace(target, replacement), 'utf8');
    return true;
  }
  return false;
}

function patchJavaScriptTransformer() {
  const file = path.join(
    ROOT,
    'node_modules',
    '@angular',
    'build',
    'src',
    'tools',
    'javascript-transformer',
    'javascript-transformer.js',
  );
  if (!fs.existsSync(file)) return false;

  const marker = '/* @dm-jstransform-snap-patched */';
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(marker)) return false;

  const target = [
    '    async transformFile(filename, options) {',
    '        return this.#runWithThrottle(async () => {',
    '            const data = await (0, promises_1.readFile)(filename);',
    '            return this.#transform(filename, data, options);',
    '        });',
    '    }',
  ].join('\n');

  const replacement = [
    `    static #dmFs = require('node:fs'); ${marker}`,
    "    static #dmV8 = require('node:v8');",
    "    static #DM_SNAP_FILE = '/tmp/dm-ng-jstransform-snap-v1.bin';",
    '    static #dmSnapMap = null;',
    '    static #dmSnapDirty = false;',
    '    static #dmSaveTimer = null;',
    '    static #getDmSnap() {',
    '        if (JavaScriptTransformer.#dmSnapMap) return JavaScriptTransformer.#dmSnapMap;',
    "        if (process.platform === 'linux') {",
    '            try {',
    '                if (JavaScriptTransformer.#dmFs.existsSync(JavaScriptTransformer.#DM_SNAP_FILE)) {',
    '                    JavaScriptTransformer.#dmSnapMap = JavaScriptTransformer.#dmV8.deserialize(JavaScriptTransformer.#dmFs.readFileSync(JavaScriptTransformer.#DM_SNAP_FILE));',
    '                    return JavaScriptTransformer.#dmSnapMap;',
    '                }',
    '            } catch {}',
    '        }',
    '        JavaScriptTransformer.#dmSnapMap = new Map();',
    '        return JavaScriptTransformer.#dmSnapMap;',
    '    }',
    '    static #saveDmSnap() {',
    "        if (process.platform !== 'linux' || !JavaScriptTransformer.#dmSnapDirty || JavaScriptTransformer.#dmSaveTimer) return;",
    '        JavaScriptTransformer.#dmSaveTimer = setTimeout(() => {',
    '            JavaScriptTransformer.#dmSaveTimer = null;',
    '            if (!JavaScriptTransformer.#dmSnapDirty || !JavaScriptTransformer.#dmSnapMap) return;',
    '            JavaScriptTransformer.#dmSnapDirty = false;',
    '            try {',
    '                const tmp = `${JavaScriptTransformer.#DM_SNAP_FILE}.${process.pid}.${Date.now()}`;',
    '                JavaScriptTransformer.#dmFs.writeFileSync(tmp, JavaScriptTransformer.#dmV8.serialize(JavaScriptTransformer.#dmSnapMap));',
    '                JavaScriptTransformer.#dmFs.renameSync(tmp, JavaScriptTransformer.#DM_SNAP_FILE);',
    '            } catch {}',
    '        }, 250);',
    '        JavaScriptTransformer.#dmSaveTimer.unref?.();',
    '    }',
    '    async transformFile(filename, options) {',
    "        if (process.platform === 'linux' && filename.includes('/node_modules/') && !options?.instrumentForCoverage && !this.#commonOptions.advancedOptimizations) {",
    '            const snap = JavaScriptTransformer.#getDmSnap();',
    '            const key = `${filename}|${!!options?.skipLinker}|${this.#commonOptions.sourcemap}|${this.#commonOptions.thirdPartySourcemaps}|${this.#commonOptions.jit}`;',
    '            const cached = snap.get(key);',
    '            if (cached !== undefined) return cached;',
    '            const res = await this.#runWithThrottle(async () => {',
    '                const data = await (0, promises_1.readFile)(filename);',
    '                return this.#transform(filename, data, options);',
    '            });',
    '            snap.set(key, res);',
    '            JavaScriptTransformer.#dmSnapDirty = true;',
    '            JavaScriptTransformer.#saveDmSnap();',
    '            return res;',
    '        }',
    '        return this.#runWithThrottle(async () => {',
    '            const data = await (0, promises_1.readFile)(filename);',
    '            return this.#transform(filename, data, options);',
    '        });',
    '    }',
  ].join('\n');

  if (content.includes(target)) {
    fs.writeFileSync(file, content.replace(target, replacement), 'utf8');
    return true;
  }
  return false;
}

function patchVitestBuildOptions() {
  const file = path.join(
    ROOT,
    'node_modules',
    '@angular',
    'build',
    'src',
    'builders',
    'unit-test',
    'runners',
    'vitest',
    'build-options.js',
  );
  if (!fs.existsSync(file)) return false;

  const markerV2 = '/* @dm-vitest-no-styles-patched-v2 */';
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(markerV2)) return false;

  const v1Block = [
    '        ssr: false, /* @dm-vitest-no-styles-patched */',
    '        prerender: false,',
    '        styles: options.browsers?.length ? baseBuildOptions.styles : [],',
  ].join('\n');

  const unpatchedBlock = '        ssr: false,\n        prerender: false,';
  const replacement = [
    `        ssr: false, ${markerV2}`,
    '        prerender: false,',
    '        styles: options.browsers?.length ? baseBuildOptions.styles : [],',
  ].join('\n');

  if (content.includes(v1Block)) {
    content = content.replace(v1Block, replacement);
  } else if (content.includes(unpatchedBlock)) {
    content = content.replace(unpatchedBlock, replacement);
  }

  content = content.replace(
    '        disableCodeSplitting: !options.splitting,',
    '        disableCodeSplitting: options.splitting === false,',
  );

  fs.writeFileSync(file, content, 'utf8');
  return true;
}

function patchJsdomBundle() {
  const file = path.join(ROOT, 'node_modules', 'jsdom', 'lib', 'api.js');
  if (!fs.existsSync(file)) return false;

  if (process.platform === 'linux' && !fs.existsSync('/tmp/jsdom-bundle.cjs')) {
    try {
      const { execFileSync } = require('node:child_process');
      const esbuildBin = path.join(ROOT, 'node_modules', '@esbuild', 'linux-x64', 'bin', 'esbuild');
      if (fs.existsSync(esbuildBin)) {
        fs.copyFileSync(
          path.join(ROOT, 'node_modules', 'jsdom', 'lib', 'jsdom', 'browser', 'default-stylesheet.css'),
          '/tmp/default-stylesheet.css',
        );
        fs.copyFileSync(
          path.join(ROOT, 'node_modules', 'jsdom', 'lib', 'jsdom', 'living', 'xhr', 'xhr-sync-worker.js'),
          '/tmp/xhr-sync-worker.js',
        );
        execFileSync(esbuildBin, [
          file,
          '--bundle',
          '--platform=node',
          '--format=cjs',
          '--outfile=/tmp/jsdom-bundle.cjs',
          '--external:canvas',
          '--external:bufferutil',
          '--external:utf-8-validate',
        ]);
        const bundled = fs
          .readFileSync('/tmp/jsdom-bundle.cjs', 'utf8')
          .replaceAll('../../browser/default-stylesheet.css', '/tmp/default-stylesheet.css')
          .replaceAll('./xhr-sync-worker.js', '/tmp/xhr-sync-worker.js');
        fs.writeFileSync('/tmp/jsdom-bundle.cjs', bundled, 'utf8');
      }
    } catch {}
  }

  const marker = '/* @dm-jsdom-bundle-patched */';
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(marker)) return false;

  const preamble = [
    `"use strict"; ${marker}`,
    "if (process.platform === 'linux' && require('node:fs').existsSync('/tmp/jsdom-bundle.cjs')) {",
    "  module.exports = require('/tmp/jsdom-bundle.cjs');",
    '  return;',
    '}',
  ].join('\n');

  if (content.startsWith('"use strict";')) {
    fs.writeFileSync(file, content.replace('"use strict";', preamble), 'utf8');
    return true;
  }
  return false;
}

const chokidarPatched = patchChokidar();
const angularPatched = patchAngularWatcher();
const vitestPatched = patchAngularVitestPlugin();
const vitestTimeoutPatched = patchVitestTimeouts();
const cachePatched = patchNormalizeCache();
const hostPatched = patchAngularHost();
const jsTransformPatched = patchJavaScriptTransformer();
const vitestBuildOptionsPatched = patchVitestBuildOptions();
const jsdomBundlePatched = patchJsdomBundle();
if (
  chokidarPatched ||
  angularPatched ||
  vitestPatched ||
  vitestTimeoutPatched ||
  cachePatched ||
  hostPatched ||
  jsTransformPatched ||
  vitestBuildOptionsPatched ||
  jsdomBundlePatched
) {
  console.log('[patch-angular-watcher] Applied polling ignore / Vitest parallelism / Linux /tmp cache patches.');
}

