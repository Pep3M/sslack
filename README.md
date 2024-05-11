# sslack

![1715393379939](image/Readme/1715393379939.png)


sslack es una herramienta de línea de comandos (CLI) que permite interactuar de manera sencilla con la api de Slack enviando mensajes y archivos a canales y usuarios de tu workspace.

## Ejemplo de uso

```bash
sslack send --channel XXXXXX --message "Hello, world!" --token XXXXXX
```

```bash
sslack send -c XXXXXX --file /path/to/file --t XXXXXX
```

Puedes almacenar localmente el token y los nombres de canales (`HOME_DIR/.sslackConfig`) para no tener que especificarlos en cada comando:

```bash
slack set-channel -c XXXXXX -n test_channel
slack set-token -t XXXXXX
```

```bash
sslack send -n test_channel -m "Hello, world!"
```

## Instalación del repositorio

Para crearte el ejecutable `sslack`, necesitas tener **Node.js** y **Bun** instalados en tu máquina. Luego, puedes clonar este repositorio y ejecutar `bun install` para instalar las dependencias.

```bash
git clone <url del repositorio>
cd sslack
bun install
```

## Crear un ejecutable (Linux)

Para crear un compilado de sslack, puedes ejecutar el script build definido en el archivo package.json:

```bash
bun run build
```

Esto te creara un ejecutable en el siguiente directorio: `./dist/sslack`

## Instalarlo globalmente

Si tras exportar el ejecutable deseas instalarlo globalmente en tu sistema, puedes ejecutar el siguiente comando para copiar el fichero a la carpeta `/usr/local/bin`:

```bash
sudo cp ./dist/sslack /usr/local/bin
```

## Integración con Slack
Para poder usarlo en tu workspace de Slack, necesitas [crear una app](https://api.slack.com/apps/) (de tipo Bot bastará) en dicho workspace y obtener un token de autenticación (OAuth). Ademas, deberás otorgarle los siguientes permisos a tu app:
- channels:join
- channels:write.invites
- chat:write
- files:write
- groups:write
- groups:write.invites
- im:write.invites
- mpim:write.invites

Siempre podrás limitar los permisos de tu app a los que realmente necesite.

## Contribuir

Si deseas contribuir a sslack, puedes hacer un fork del repositorio, crear una nueva rama para tus cambios, y luego hacer un pull request. Asegúrate de que tus cambios pasen todos los tests antes de hacer el pull request.

## Licencia

sslack está licenciado bajo la licencia MIT, que puedes leer en el archivo [LICENSE.md](LICENSE.md).
