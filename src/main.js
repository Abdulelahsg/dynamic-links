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
 * @param {string} ua - User-Agent string
 * @returns {string[]} - Array of detected platforms
 */
function detectPlatforms(ua) {
  return Object.keys(detectors).filter((platform) => detectors[platform](ua));
}

export default async ({ req, res, log }) => {
  const config = [
    {
      path: "/test",
      targets: {
        mobile: "https://m.example.com/test",
        desktop: "https://www.example.com/test",
        default: "https://www.example.com/test",
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

  const userAgent = req.headers['user-agent'] || '';
  const platforms = detectPlatforms(userAgent);
  log(`Detected platforms: ${platforms.join(', ')}`);

  const targetPlatform = platforms.find((platform) => targets[platform]);
  if (targetPlatform) {
    const targetUrl = targets[targetPlatform];
    log(`Redirecting to ${targetUrl}`);
    return res.redirect(targetUrl);
  }

  log('No matching target platform');
  return res.redirect(targets.default);
};
