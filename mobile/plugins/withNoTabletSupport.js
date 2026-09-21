const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Exclut les tablettes/grands écrans Android de la distribution Play Store via
 * <supports-screens>. Équivalent Android de `ios.supportsTablet: false`.
 */
module.exports = function withNoTabletSupport(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults.manifest['supports-screens'] = [
      {
        $: {
          'android:smallScreens': 'true',
          'android:normalScreens': 'true',
          'android:largeScreens': 'false',
          'android:xlargeScreens': 'false',
          'android:anyDensity': 'true',
        },
      },
    ];
    return config;
  });
};
