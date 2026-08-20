module.exports = {
  appId: 'com.prism.app',
  productName: 'Prism',
  directories: {
    output: 'dist',
    buildResources: 'public',
  },
  files: [
    'electron/**/*',
    'out/**/*',
    'package.json',
  ],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'public/icons/icon-512.png',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'public/icons/icon-512.png',
    uninstallerIcon: 'public/icons/icon-512.png',
    installerHeaderIcon: 'public/icons/icon-512.png',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
}