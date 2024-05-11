import fs from 'fs';
import path from 'path';
import ini from 'ini';
import os from 'os';

const configFilePath = path.join(os.homedir(), '.sslackConfig');

if (!fs.existsSync(configFilePath)) {
  fs.writeFileSync(configFilePath, '');
}

export const getConfig = () => {
  return ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
};

export const setToken = (token) => {
  const config = getConfig();
  fs.writeFileSync(configFilePath, ini.stringify({
    ...config,
    OAuth_Token: token
  }));
  console.log('Token guardado correctamente');
}

// channels
export const listChannels = () => {
  const config = getConfig();
  const channels = Object.keys(config).filter(key => key.startsWith('CH_'));
  if (channels.length === 0) return console.warn('No se han encontrado canales guardados. Pruebe crear uno con `sslack --set-channel -c <channel-id> -n <channel-name>`');
  console.log('Canales guardados:');
  channels.forEach(channel => {
    console.log(channel.replace('CH_', ''), '->', config[channel]);
  });
}

export const setChannel = (channelId, channelLabel) => {
  const channelNameParsed = `CH_${channelLabel}`;
  const config = getConfig();
  config[channelNameParsed] = channelId;
  fs.writeFileSync(configFilePath, ini.stringify(config));
  console.log(`Canal ${channelLabel} guardado correctamente`);
}

export const getChannelId = (channelLabel) => {
  const config = getConfig();
  const channelId = config[`CH_${channelLabel}`];
  if (!channelId) {
    console.error('No se ha encontrado un canal con ese nombre. Pruebe a guardar el canal con `sslack --set-channel <channel-id> <channel-name>` o listar los canales guardados con `sslack --list-channels`');
    process.exit(1);
  }
  return channelId;
}
