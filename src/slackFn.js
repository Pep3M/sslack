import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { getConfig } from './configHandler';

const config = getConfig();

export async function sendFile(channelId, filePath, optToken) {
  if (!fs.existsSync(filePath)) {
    console.error('El archivo a subir no existe en la ruta proporcionada');
    process.exit(1);
  }

  if (!channelId){
    console.error('Debes especificar un canal al que enviar el archivo. Use la flag -f <channel-id>');
    process.exit(1);
  }

  const token = optToken || config.OAuth_Token;
  if (!token) {
    console.error('No se ha encontrado un token de autenticación. Por favor, introduce tu token con `sslack --set-token <token>`');
    process.exit(1);
  }
  
  let filename = filePath.split('/').pop();
  let filetype = filename.split('.').pop();

  let form = new FormData();
  form.append('token', token);
  form.append('title', filename);
  form.append('filename', filename);
  form.append('filetype', filetype);
  form.append('channels', channelId);
  form.append('file', fs.createReadStream(filePath));

  function formatBytes(bits) {
    let bytes = bits / 8;
    let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }

  axios.post('https://slack.com/api/files.upload', form, {
    headers: {
      'Accept-Encoding': 'gzip',
      ...form.getHeaders()
    },
    onUploadProgress: function(progressEvent) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Subido ${formatBytes(progressEvent.loaded)}`);
    }
  })
  .then(function (response) {
    process.stdout.write('\n');
    if (response.data.ok) {
      return console.log('Archivo subido correctamente');
    }
    console.error('Error al subir el archivo', response.data.error);
  })
  .catch(function (error) {
    console.error(error);
  });
}

export async function sendMessage(channelId, message, optToken) {
  if (!channelId){
    console.error('Debes especificar un canal al que enviar el mensaje. Use la flag -f <channel-id>');
    process.exit(1);
  }

  const token = optToken || config.OAuth_Token;
  if (!token) {
    console.error('No se ha encontrado un token de autenticación. Por favor, introduce tu token con `sslack --set-token <token>`');
    process.exit(1);
  }

  let form = new FormData();
  form.append('token', token);
  form.append('channel', channelId);
  form.append('text', message);

  axios.post('https://slack.com/api/chat.postMessage', form, {
    headers: {
      'Accept-Encoding': 'gzip',
      ...form.getHeaders()
    }
  })
  .then(function (response) {
    if (response.data.ok) {
      return console.log('Mensaje enviado correctamente:', response.data.message.text);
    }
    console.error('Error al enviar el mensaje', response.data.error);
  })
  .catch(function (error) {
    console.error(error);
  });
}