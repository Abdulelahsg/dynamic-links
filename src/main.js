import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const staticFolder = path.join(__dirname, '../static');

// Detector functions
const detectors = {
  android: (ua) => /Android/i.test(ua),
};

/**
 * Detects if the request is coming from an Android device.
 * @param {string} ua - User-Agent string
 * @returns {boolean} - True if the request is from an Android device, false otherwise
 */
function isAndroid(ua) {
  return detectors.android(ua);
}

export default async ({ req, res, log }) => {
  const config = [
    {
      "path": "/app",
      "targets": {
        "android": {
          "appName": "Artify",
          "appPackage": "com.example.animeimageaigenerator",
          "appPath": "artify://app/reset-password",
          "fallback": "https://play.google.com/store/apps/details?id=com.fivesocialmedia.fivesocialmedia&pli=1"
        },
      },
    },
  ];

  if (config.length === 0) {
    throw new Error('CONFIG environment variable must be set');
  }

  const targets = config.find(({ path }) => path === req.path)?.targets;
  if (!targets) {
    log(`No targets for path ${req.path}`);
    return res.empty();
  }
  log(`Found targets for path ${req.path}`);

  const isAndroidDevice = isAndroid(req.headers['user-agent']);
  if (!isAndroidDevice) {
    log(`Request is not from an Android device`);
    return res.empty();
  }

  const androidTarget = targets['android']; // Accessing the android target correctly
  if (!androidTarget) {
    log(`No redirect target specified for Android platform`);
    return res.empty();
  }

  log(`Redirecting to Android target: ${androidTarget.appName}`);

  const template = readFileSync(
    path.join(staticFolder, 'deeplink.html')
  ).toString();

  const html = template
    .split('{{APP_NAME}}')
    .join(androidTarget.appName)
    .split('{{APP_PATH}}')
    .join(androidTarget.appPath)
    .split('{{APP_PACKAGE}}')
    .join(androidTarget.appPackage ?? '')
    .split('{{FALLBACK}}')
    .join(androidTarget.fallback ?? '');

  return res.send(html, 200, {
    'Content-Type': 'text/html; charset=utf-8',
  });
};
