import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const staticFolder = path.join(__dirname, '../static');

// Detector functions
const detectors = {
  android: (ua) => /Android/i.test(ua),
  ios: (ua) => /iPhone|iPad|iPod/i.test(ua),
  mobile: (ua) =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
  desktop: (ua) =>
    !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      ua
    ) && /Windows|Macintosh|Linux/i.test(ua),
};

/**
 * Detects platforms from the user-agent string.
 * @param {string} ua
 * @returns {string[]}
 */
function detectPlatforms(ua) {
  const detectedPlatforms = Object.keys(detectors).filter((key) => detectors[key](ua));
  console.log('Detected platforms:', detectedPlatforms);
  return detectedPlatforms;
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
        "ios": {
          "appName": "twitter",
          "appPath": "user?screen_name=appwrite",
          "fallback": "https://apps.apple.com/us/app/twitter/id333903271"
        }
      }
    }
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

  const userAgent = req.headers['user-agent'] || '';
  console.log('User agent:', userAgent);

  const platforms = detectPlatforms(userAgent);
  log(`Detected platforms: ${platforms.join(', ')}`);

  for (const platform of platforms) {
    const target = targets[platform];
    if (!target) {
      log(`No redirect for platform ${platform}`);
      continue;
    }

    if (platform === 'default') {
      log(`Default for platform ${platform}`);
      return res.redirect(targets.default);
    }

    if (typeof target === 'string') {
      log(`Simple redirect to ${target}`);
      return res.redirect(target);
    }

    if (typeof target === 'object' && target.appName) {
      log(`Deep link to app=${target.appName} path=${target.appPath}`);

      const template = readFileSync(
        path.join(staticFolder, 'deeplink.html')
      ).toString();

      const html = template
        .split('{{APP_NAME}}')
        .join(target.appName)
        .split('{{APP_PATH}}')
        .join(target.appPath)
        .split('{{APP_PACKAGE}}')
        .join(target.appPackage ?? '')
        .split('{{FALLBACK}}')
        .join(target.fallback ?? target.default ?? '');

      return res.send(html, 200, {
        'Content-Type': 'text/html; charset=utf-8',
      });
    }
  }

  log(`Out of ideas, returning empty response`);
  return res.empty();
};
