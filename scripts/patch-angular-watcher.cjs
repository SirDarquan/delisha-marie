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

  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(PATCH_MARKER)) return false;

  const target = '                    isolate: false,\n                    sequence: { setupFiles: \'list\' },';
  const replacement = [
    `                    isolate: false, ${PATCH_MARKER}`,
    '                    fileParallelism: false,',
    "                    sequence: { setupFiles: 'list' },",
  ].join('\n');

  if (content.includes(target)) {
    fs.writeFileSync(file, content.replace(target, replacement), 'utf8');
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
    let content = fs.readFileSync(file, 'utf8');
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

const chokidarPatched = patchChokidar();
const angularPatched = patchAngularWatcher();
const vitestPatched = patchAngularVitestPlugin();
const vitestTimeoutPatched = patchVitestTimeouts();
if (chokidarPatched || angularPatched || vitestPatched || vitestTimeoutPatched) {
  console.log('[patch-angular-watcher] Applied polling ignore / Vitest parallelism patch.');
}
