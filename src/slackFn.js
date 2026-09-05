import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import { getConfig } from './configHandler';

// constants
const SLACK_API_URL = 'https://slack.com/api';
const SLACK_GET_UPLOAD_URL = `${SLACK_API_URL}/files.getUploadURLExternal`;
const SLACK_COMPLETE_UPLOAD_URL = `${SLACK_API_URL}/files.completeUploadExternal`;
const SLACK_MESSAGE_URL = `${SLACK_API_URL}/chat.postMessage`;

const config = getConfig();

function resolveToken(optToken) {
  const token = optToken || config.OAuth_Token;
  if (!token) {
    console.error('No se ha encontrado un token de autenticación. Por favor, introduce tu token con `sslack set-token -t <token>`');
    process.exit(1);
  }
  return token;
}

function requireChannel(channelId) {
  if (!channelId) {
    console.error('Debes especificar un canal. Use la flag -c <channel-id>');
    process.exit(1);
  }
}

// La barra de progreso solo tiene sentido en una terminal interactiva: fuera de
// una TTY (scripts, CI, agentes) process.stdout.clearLine no existe.
function progressReporter() {
  if (!process.stdout.isTTY) return undefined;
  return function (progressEvent) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`Subido ${progressEvent.loaded} bytes`);
  };
}

function fail(message, error) {
  console.error(message, error ?? '');
  process.exitCode = 1;
}

export async function sendFile(channelId, filePath, optToken) {
  requireChannel(channelId);

  if (!fs.existsSync(filePath)) {
    console.error('El archivo a subir no existe en la ruta proporcionada');
    process.exit(1);
  }

  const token = resolveToken(optToken);
  const filename = path.basename(filePath);
  const length = fs.statSync(filePath).size;
  const authHeader = { Authorization: `Bearer ${token}` };

  try {
    // 1. Slack nos devuelve una URL de subida de un solo uso y el id del futuro fichero
    const { data: upload } = await axios.get(SLACK_GET_UPLOAD_URL, {
      headers: authHeader,
      params: { filename, length }
    });
    if (!upload.ok) return fail('Error al preparar la subida del archivo', upload.error);

    // 2. Subimos el contenido a esa URL
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    await axios.post(upload.upload_url, form, {
      headers: form.getHeaders(),
      onUploadProgress: progressReporter()
    });
    if (process.stdout.isTTY) process.stdout.write('\n');

    // 3. Confirmamos la subida y la compartimos en el canal
    const { data: completed } = await axios.post(SLACK_COMPLETE_UPLOAD_URL, {
      files: [{ id: upload.file_id, title: filename }],
      channel_id: channelId
    }, {
      headers: { ...authHeader, 'Content-Type': 'application/json; charset=utf-8' }
    });
    if (!completed.ok) return fail('Error al subir el archivo', completed.error);

    console.log('Archivo subido correctamente');
  } catch (error) {
    fail('Error al subir el archivo', error.message);
  }
}

export async function sendMessage(channelId, message, optToken) {
  requireChannel(channelId);

  const token = resolveToken(optToken);

  try {
    const { data } = await axios.post(SLACK_MESSAGE_URL, {
      channel: channelId,
      text: message
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    if (!data.ok) return fail('Error al enviar el mensaje', data.error);

    console.log('Mensaje enviado correctamente:', data.message.text);
  } catch (error) {
    fail('Error al enviar el mensaje', error.message);
  }
}
