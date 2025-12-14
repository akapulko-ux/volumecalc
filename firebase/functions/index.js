const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const SECRET =
  process.env.FORCE_UPDATE_SECRET ||
  (functions.config().force_update && functions.config().force_update.secret) ||
  'change-me';

exports.setMinVersion = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Secret');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }
  const headerSecret = req.header('X-Admin-Secret');
  if (headerSecret !== SECRET) {
    res.status(401).send('Unauthorized');
    return;
  }

  const { minSupportedVersion, forceUpdateLink = '' } = req.body || {};
  if (!minSupportedVersion || typeof minSupportedVersion !== 'string') {
    res.status(400).send('minSupportedVersion is required');
    return;
  }

  try {
    const remoteConfig = admin.remoteConfig();
    const template = await remoteConfig.getTemplate();
    template.parameters.minSupportedVersion = {
      defaultValue: { value: minSupportedVersion },
    };
    template.parameters.forceUpdateLink = {
      defaultValue: { value: forceUpdateLink },
    };

    const publishedTemplate = await remoteConfig.publishTemplate(template);
    res.status(200).json({
      minSupportedVersion,
      forceUpdateLink,
      version: publishedTemplate.versionNumber,
    });
  } catch (err) {
    console.error('Failed to update Remote Config', err);
    res.status(500).send('Failed to update Remote Config');
  }
});

