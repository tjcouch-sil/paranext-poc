const path = require('path');

const rootPath = path.join(__dirname, '../..');

const dllPath = path.join(__dirname, '../dll');

const nodeModulesPath = path.join(rootPath, 'node_modules');
const assetsPath = path.join(rootPath, 'assets');

const srcPath = path.join(rootPath, 'src');
const srcMainPath = path.join(srcPath, 'main');
const srcRendererPath = path.join(srcPath, 'renderer');
const srcSharedPath = path.join(srcPath, 'shared');

const componentsPath = path.join(srcRendererPath, 'components');
const servicesPath = path.join(srcRendererPath, 'services');
const utilPath = path.join(srcRendererPath, 'util');

const releasePath = path.join(rootPath, 'release');
const appPath = path.join(releasePath, 'app');
const appPackagePath = path.join(appPath, 'package.json');
const appNodeModulesPath = path.join(appPath, 'node_modules');
const srcNodeModulesPath = path.join(srcPath, 'node_modules');

const distPath = path.join(appPath, 'dist');
const distMainPath = path.join(distPath, 'main');
const distRendererPath = path.join(distPath, 'renderer');

const buildPath = path.join(releasePath, 'build');

export default {
  rootPath,
  dllPath,
  nodeModulesPath,
  assetsPath,
  srcPath,
  srcMainPath,
  srcRendererPath,
  srcSharedPath,
  componentsPath,
  servicesPath,
  utilPath,
  releasePath,
  appPath,
  appPackagePath,
  appNodeModulesPath,
  srcNodeModulesPath,
  distPath,
  distMainPath,
  distRendererPath,
  buildPath,
};
