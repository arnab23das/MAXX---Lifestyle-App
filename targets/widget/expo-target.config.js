/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'MaxxWidget',
  displayName: 'MAXX',
  colors: {
    $accent: { color: '#9184D9', darkColor: '#9184D9' },
    $widgetBackground: { color: '#0F111A', darkColor: '#0F111A' },
  },
  frameworks: ['SwiftUI', 'WidgetKit'],
  deploymentTarget: '16.0',
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
