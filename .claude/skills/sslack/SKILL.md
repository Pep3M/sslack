---
name: sslack
description: Enviar mensajes y archivos a Slack desde la terminal con el CLI `sslack`. TRIGGER cuando el usuario pida avisar, notificar, mandar, publicar o compartir algo por Slack (un mensaje, un resultado, un log, un informe, una captura, un fichero), cuando diga «avísame por Slack», «mándalo al canal», «notifica al equipo», o cuando mencione sslack. SKIP si el usuario quiere leer/consultar mensajes de Slack (este CLI solo escribe).
---

# sslack — enviar a Slack desde la CLI

`sslack` es un binario que envía mensajes y ficheros a canales o usuarios de un workspace de Slack
usando la API oficial (`chat.postMessage` y `files.upload`).

## Antes de enviar

**Enviar a Slack es una acción externa e irreversible.** Confirma con el usuario el canal y el
contenido antes del primer envío de una conversación, salvo que te haya dado el canal explícitamente
o te haya autorizado a enviar sin preguntar.

No mandes nunca secretos, tokens, credenciales ni contenido de ficheros que no hayas leído.

## Obtener el token

El token del bot vive en el keyring del sistema, no en el repo ni en el historial de shell:

```bash
secret-tool lookup service sslack account bot
```

Úsalo en línea con la flag `-t`. Si el comando no devuelve nada, el token no está guardado: pide al
usuario que lo guarde (ver «Guardar el token» más abajo) en vez de inventarte otra vía.

## Enviar un mensaje

```bash
sslack send -c <CHANNEL_ID> -m "Mensaje" -t "$(secret-tool lookup service sslack account bot)"
```

Con un canal ya registrado por nombre:

```bash
sslack send -n <nombre-canal> -m "Mensaje" -t "$(secret-tool lookup service sslack account bot)"
```

## Enviar un archivo o una imagen

```bash
sslack send -n <nombre-canal> -f /ruta/al/fichero -t "$(secret-tool lookup service sslack account bot)"
```

Internamente usa el flujo vigente de la API de Slack —`files.getUploadURLExternal` → subida a la
URL devuelta → `files.completeUploadExternal`—, porque `files.upload` está retirada desde marzo de
2025. Si alguna vez ves `method_deprecated`, el binario instalado es anterior a esa migración:
recompílalo con `bun run build` y reinstálalo en `/usr/local/bin`.

Para enviar una imagen que el usuario ha adjuntado en el chat, pásale la ruta del fichero cacheado
que acompaña a la imagen; no la reproduzcas ni la vuelvas a generar.

`-f` y `-m` son excluyentes: si pasas `-f`, el `-m` se ignora. Para acompañar un fichero con texto,
haz dos envíos.

## Canales guardados

```bash
sslack list-channels                      # lista los alias guardados
sslack set-channel -c <CHANNEL_ID> -n <alias>
```

Los alias se guardan en `~/.sslackConfig` como `CH_<alias>=<CHANNEL_ID>`. Consulta
`list-channels` antes de preguntar al usuario por un ID de canal: puede que el alias ya exista.

Para enviar a un usuario en DM, el ID de canal es el ID del usuario (`U...`) o el del DM (`D...`).

## Verificar el resultado

El CLI sale con código 1 si Slack rechaza la petición, pero aun así lee la salida:

- `Mensaje enviado correctamente: ...` / `Archivo subido correctamente` → OK.
- `not_in_channel` → el bot no está en el canal; hay que invitarlo desde Slack.
- `channel_not_found` → ID de canal incorrecto o el bot no ve ese canal.
- `invalid_auth` / `not_authed` → el token del keyring es inválido o está vacío.
- `missing_scope` → falta un permiso OAuth en la app de Slack (`chat:write`, `files:write`).

Bun emite un `DeprecationWarning` sobre `url.parse()` en cada ejecución: es ruido, no un fallo.

No informes de un envío como completado sin haber visto la línea de éxito.

## Guardar el token (una sola vez, lo hace el usuario)

```bash
secret-tool store --label="sslack bot token" service sslack account bot
```

Pide el token por prompt oculto; no queda en el historial ni en `~/.sslackConfig`.

## Notas

- `-t "$(secret-tool ...)"` expone el token en la línea de comandos, visible en `ps` mientras dura
  el proceso. En una máquina compartida, la alternativa es `sslack set-token -t "$(...)"` una vez
  (lo escribe en texto plano en `~/.sslackConfig`, que conviene dejar en `chmod 600`) y luego
  invocar `sslack send` sin `-t`.
- El código fuente está en `src/`: `index.js` (comandos), `slackFn.js` (llamadas a la API),
  `configHandler.js` (`~/.sslackConfig`). Tras tocar `src/`, hay que `bun run build` y copiar
  `./dist/sslack` a `/usr/local/bin` (necesita `sudo`, lo ejecuta el usuario).
