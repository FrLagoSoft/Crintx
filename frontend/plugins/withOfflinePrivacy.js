const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

module.exports = function withOfflinePrivacy(config) {
  config = withAndroidManifest(config, config => {
    const app = config.modResults.manifest.application[0].$;
    app['android:allowBackup'] = 'false';
    app['android:fullBackupContent'] = 'false';
    app['android:dataExtractionRules'] = '@xml/offline_data_extraction_rules';
    for (const permission of config.modResults.manifest['uses-permission'] ?? []) {
      const name = permission.$['android:name'];
      if (name === 'android.permission.BLUETOOTH_SCAN') permission.$['android:usesPermissionFlags'] = 'neverForLocation';
      if (['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.BLUETOOTH', 'android.permission.BLUETOOTH_ADMIN'].includes(name)) {
        permission.$['android:maxSdkVersion'] = '30';
        permission.$['tools:replace'] = 'android:maxSdkVersion';
      }
    }
    return config;
  });
  return withDangerousMod(config, ['android', async config => {
    const directory = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    fs.mkdirSync(directory, { recursive: true });
    const exclusions = ['root', 'file', 'database', 'sharedpref', 'external', 'device_root', 'device_file', 'device_database', 'device_sharedpref']
      .map(domain => `    <exclude domain="${domain}" path="." />`).join('\n');
    fs.writeFileSync(path.join(directory, 'offline_data_extraction_rules.xml'),
      `<?xml version="1.0" encoding="utf-8"?>\n<data-extraction-rules>\n  <cloud-backup>\n${exclusions}\n  </cloud-backup>\n  <device-transfer>\n${exclusions}\n  </device-transfer>\n</data-extraction-rules>\n`);
    const release = path.join(config.modRequest.platformProjectRoot, 'app/src/release');
    fs.mkdirSync(release, { recursive: true });
    fs.writeFileSync(path.join(release, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
  <uses-permission android:name="android.permission.INTERNET" tools:node="remove" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" tools:node="remove" />
</manifest>
`);
    return config;
  }]);
};
