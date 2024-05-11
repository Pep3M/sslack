import { program } from 'commander';
import { sendFile, sendMessage } from './slackFn';
import { getChannelId, listChannels, setChannel, setToken } from './configHandler';

program
  .command('send')
  .description('Envía un mensaje o archivo a un canal de Slack')
  .option('-c, --channel <channel>', 'ID del canal de Slack')
  .option('-n, --name <name>', 'Nombre del canal de Slack')
  .option('-m, --message <message>', 'Mensaje a enviar')
  .option('-f, --file <file>', 'Ruta del archivo a enviar')
  .option('-t, --token <token>', 'Token de autenticación de Slack (opcional)')
  .action((cmdObj) => {
    if (!cmdObj.name && !cmdObj.channel) return console.error('Debes especificar un canal al que enviar el mensaje. Use la flag -f <channel-id> o -n <custom-channel-name>');
    const channelId = cmdObj.channel || getChannelId(cmdObj.name);
    if (cmdObj.file) {
      sendFile(channelId, cmdObj.file, cmdObj.token);
    } else {
      sendMessage(channelId, cmdObj.message, cmdObj.token);
    }
  });

program
  .command('set-token')
  .description('Establece el token de autenticación de Slack')
  .requiredOption('-t, --token <token>', 'Token de autenticación de Slack')
  .action((cmdObj) => {
    setToken(cmdObj.token);
  });

program
  .command('set-channel')
  .description('Establece un nombre de canal de Slack personalizado')
  .requiredOption('-c, --channel <channel>', 'ID del canal de Slack')
  .requiredOption('-n, --name <name>', 'Nombre del canal de Slack')
  .action((cmdObj) => {
    setChannel(cmdObj.channel, cmdObj.name);
  });

program
  .command('list-channels')
  .description('Lista los canales de Slack guardados')
  .action(listChannels);
    
program.parse(process.argv); 