import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { getConfig } from './configHandler';

// constants
const SLACK_API_URL = 'https://slack.com/api';
const SLACK_UPLOAD_URL = `${SLACK_API_URL}/files.upload`;
const SLACK_MESSAGE_URL = `${SLACK_API_URL}/chat.postMessage`;

const config = getConfig();

async function uploadToSlack({ options, form, onUploadProgress, onResponse }) {
  const { channelId, optToken, endpoint } = options;

  if (!channelId) {
    console.error('Debes especificar un canal. Use la flag -f <channel-id>');
    process.exit(1);
  }

  const token = optToken || config.OAuth_Token;
  if (!token) {
    console.error('No se ha encontrado un token de autenticación. Por favor, introduce tu token con `sslack --set-token <token>`');
    process.exit(1);
  }

  return axios.post(endpoint, form, {
    headers: {
      'Accept-Encoding': 'gzip',
      ...form.getHeaders()
    },
    onUploadProgress: onUploadProgress
  })
  .then(onResponse)
  .catch(function (error) {
    console.error(error);
  });
}

export async function sendFile(channelId, filePath, optToken) {
  if (!fs.existsSync(filePath)) {
    console.error('El archivo a subir no existe en la ruta proporcionada');
    process.exit(1);
  }

  let filename = filePath.split('/').pop();
  let filetype = filename.split('.').pop();

  let form = new FormData();
  form.append('token', optToken || config.OAuth_Token);
  form.append('title', filename);
  form.append('filename', filename);
  form.append('filetype', filetype);
  form.append('channels', channelId);
  form.append('file', fs.createReadStream(filePath));

  const payload = {
    options: { channelId, optToken, endpoint: SLACK_UPLOAD_URL },
    form,
    onUploadProgress: function(progressEvent) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`Subido ${progressEvent.loaded} bytes`);
    },
    onResponse: function (response) {
      process.stdout.write('\n');
      if (response.data.ok) {
        return console.log('Archivo subido correctamente');
      }
      console.error('Error al subir el archivo', response.data.error);
    }
  };
  
  return uploadToSlack(payload);
}

export async function sendMessage(channelId, message, optToken) {
  let form = new FormData();
  form.append('token', optToken || config.OAuth_Token);
  form.append('channel', channelId);
  form.append('text', message);

  const payload = {
    options: { channelId, optToken, endpoint: SLACK_MESSAGE_URL },
    form,
    onResponse: function (response) {
      if (response.data.ok) {
        return console.log('Mensaje enviado correctamente:', response.data.message.text);
      }
      console.error('Error al enviar el mensaje', response.data.error);
    }
  };
  
  return uploadToSlack(payload);
}