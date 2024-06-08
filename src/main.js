import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const staticFolder = path.join(__dirname, '../static');

export default async ({ req, res, log }) => {
  const config = [
    {
      "path": "/app",
      "targets": {
        "android": {
          "appName": "Five",
          "appPackage": "com.fivesocialmedia.fivesocialmedia",
          "appPath": "user?screen_name=appwrite1",
          "fallback": "https://play.google.com/store/apps/details?id=com.fivesocialmedia.fivesocialmedia&pli=1"
        },
        "desktop": {
          "fallback": "https://twitter.com/appwrite"
        },
        "default": "https://twitter.com/appwrite"
      }
    },
    {
      "path": "/app1",
      "targets": {
        "android": "https://play.google.com/store/apps/details?id=com.fivesocialmedia1.fivesocialmedia&pli=1",
        "desktop": "https://www.offeryard.com/",
        "default": "https://www.offeryard.com/"
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
  const isAndroid = /android/i.test(userAgent);
  const isDesktop = /windows|macintosh|linux/i.test(userAgent);

  if (!isAndroid && !isDesktop) {
    log(`Non-Android and non-Desktop device detected`);
    return res.redirect(targets.default);
  }

  let platform = 'default';
  if (isAndroid) {
    platform = 'android';
  } else if (isDesktop) {
    platform = 'desktop';
  }

  const target = targets[platform];
  if (!target) {
    log(`No redirect for platform ${platform}`);
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
      .join(target.fallback ?? targets.default ?? '');

    return res.send(html, 200, {
      'Content-Type': 'text/html; charset=utf-8',
    });
  }

  log(`Out of ideas, returning empty response`);
  return res.empty();
};
