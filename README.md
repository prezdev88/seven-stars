# Seven Stars

<p align="center">
  <img src="images/branding/seven-stars-logo.png" alt="Logo de Seven Stars" width="400">
</p>
<p align="center">
  <img src="images/branding/seven-stars-characters.png" alt="Los siete personajes de Seven Stars" width="600">
</p>

Una aventura entre estrellas: elige a tu personaje, salta entre plataformas, recoge estrellas y avanza por las etapas. ¡Cuida tus corazones y supera tu récord!

## Jugar

Abre `index.html` en un navegador moderno. No necesitas instalar dependencias ni compilar el proyecto.

Elige entre Namu, Jino, Yuno, Hobi, Jiminie, Taeo y Kookie para comenzar la carrera.

Recoge una **Army Bomb dorada** para invocar a **Mister Lee** durante siete segundos. Entra con un anuncio y fanfarria, corre delante de ti y elimina automáticamente a las armys, incluso cuando saltan. La escolta incluye la protección dorada del personaje y un contador de tiempo y enemigas despejadas. Otro objeto dorado renueva la duración; pausar congela también la escolta.

**Personaje secreto:** escribe `misterlee` en la selección de personajes para desbloquearlo y jugar con él. También puedes abrir «Código secreto» y escribirlo ahí, incluso desde el móvil. El desbloqueo queda guardado en ese navegador. Si Mister Lee recoge una Army Bomb dorada, aparece uno de los siete chicos al azar como escolta, con sus propias animaciones, retrato y nombre.

## Desplegar en un VPS con Docker Compose

Necesitas Docker Engine y el plugin Docker Compose instalados en el VPS. Copia o clona este repositorio en el servidor y, desde su carpeta, ejecuta:

```bash
cp .env.example .env
docker compose up -d --build
```

Abre `http://IP_DEL_VPS:8080`. El contenedor sirve el juego con Nginx, se reinicia automáticamente con Docker y comprueba periódicamente que la página responde. Los logs tienen rotación para limitar el espacio utilizado.

Para usar otro puerto, edita `APP_PORT` en `.env` y vuelve a ejecutar `docker compose up -d`. Por ejemplo, `APP_PORT=80` permite acceder mediante `http://IP_DEL_VPS` si el puerto 80 está disponible. Permite el puerto elegido en el firewall del VPS y del proveedor.

Si ya tienes un proxy inverso en el VPS, puedes publicar solo en la interfaz local con `APP_PORT=127.0.0.1:8080` y dirigir el proxy a `http://127.0.0.1:8080`. Para servir el juego con dominio y HTTPS, configura el dominio y el certificado en ese proxy.

Para revisar el estado y los logs:

```bash
docker compose ps
docker compose logs --tail=100 -f web
```

Para actualizar una instalación clonada con Git:

```bash
git pull --ff-only
docker compose build --pull
docker compose up -d
```

Para detenerla:

```bash
docker compose down
```

El progreso y el récord se guardan en el navegador de cada jugador; el servidor no necesita base de datos ni volúmenes persistentes.

## Controles

- **Computador:** pulsa Espacio o la flecha hacia arriba para saltar; pulsa Esc para pausar o continuar.
- **Pantalla táctil:** toca el juego para saltar y usa el botón de pausa para detener la partida.
- Pulsa o toca dos veces para hacer un doble salto.

## Archivos

- `index.html`: estructura del juego.
- `style.css`: estilos de la interfaz.
- `game.js`: lógica y animaciones.
- `images/branding/`: logo e imagen de los personajes.
- `images/portraits/`: retratos de selección.
- `images/sprites/`: sprites de personajes y elementos del juego.

- `images/backgrounds/`: escenarios ilustrados optimizados en WebP.

## Diseño visual

La interfaz combina tonos violeta y acentos dorados con un valle nocturno ilustrado. El escenario incluye luces ambientales, plataformas con textura, sombra del personaje y polvo al correr. La portada y la selección de compañeros se adaptan a escritorio, móvil y orientación horizontal. Las animaciones decorativas respetan la preferencia de movimiento reducido del dispositivo.

El fondo `images/backgrounds/starlit-valley.webp` fue generado con la herramienta integrada imagegen y optimizado en WebP (aproximadamente 158 KiB). El prompt usado está documentado en [docs/art-direction.md](docs/art-direction.md).
