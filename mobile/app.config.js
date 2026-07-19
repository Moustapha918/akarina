/**
 * app.config.js — Configuration dynamique Expo
 *
 * Lit APP_ENV (dev | staging | prod) pour switcher :
 *   - Nom de l'app affiché
 *   - Bundle ID / Android package
 *   - Variables Firebase (via .env.{APP_ENV} → .env)
 *
 * Usage :
 *   npm run dev:ios       → APP_ENV=dev
 *   npm run staging:ios   → APP_ENV=staging
 *   npm run prod:ios      → APP_ENV=prod
 */

const APP_ENV = process.env.APP_ENV ?? 'dev';

const envConfig = {
  dev: {
    appName: 'Akarina Dev',
    bundleId: 'mr.akarina.dev',
    androidPackage: 'mr.akarina.dev',
  },
  staging: {
    appName: 'Akarina Staging',
    bundleId: 'mr.akarina.staging',
    androidPackage: 'mr.akarina.staging',
  },
  prod: {
    appName: 'Akarina',
    bundleId: 'mr.akarina.app',
    androidPackage: 'mr.akarina.app',
  },
};

const env = envConfig[APP_ENV] ?? envConfig.dev;

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: env.appName,
    slug: 'akarina',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'akarina',

    ios: {
      supportsTablet: false,
      bundleIdentifier: env.bundleId,
    },

    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1B4F72',
    },

    android: {
      package: env.androidPackage,
      versionCode: 1,
      permissions: [
        'android.permission.INTERNET',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      adaptiveIcon: {
        backgroundColor: '#1B4F72',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },

    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },

    plugins: [
      'expo-router',
      'expo-status-bar',
      'expo-secure-store',
      'expo-sharing',
      [
        'expo-image-picker',
        {
          photosPermission: 'Akarina a besoin d\'accéder à vos photos pour le KYC.',
          cameraPermission: 'Akarina a besoin d\'accéder à la caméra pour photographier votre pièce d\'identité.',
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },

    // Accessible via Constants.expoConfig.extra dans l'app
    extra: {
      appEnv: APP_ENV,
      eas: {
        projectId: 'c561b900-6437-4794-b1ab-0f5ca3f34d25',
      },
    },
  },
};
