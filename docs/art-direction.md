# Dirección visual

Seven Stars combina una aventura nocturna en tonos violeta, acentos dorados y vegetación luminosa. La interfaz mantiene los personajes y la marca del juego.

## Mister Lee: aliado legendario

- Sprite: `images/sprites/mister-lee-run.png`, PNG con transparencia; tres poses de carrera y una de salto.
- Retrato: `images/portraits/mister-lee-portrait.png`, PNG con transparencia.
- Generación: herramienta integrada `imagegen`, sin CLI. La fotografía proporcionada por el usuario define la apariencia; Namu aporta únicamente la referencia del estilo pixel art.
- El personaje tiene sus propios recursos y definición. Permanece oculto en la selección hasta escribir el código `misterlee`; el desbloqueo permite jugar con él y se guarda en el navegador. La Army Bomb dorada invoca a Mister Lee durante siete segundos cuando se juega con los chicos. Cuando el jugador es Mister Lee, invoca a uno de los siete chicos al azar y la entrada utiliza el retrato, nombre y animaciones del aliado elegido.
- Entrada: retrato, anuncio «REFUERZO LEGENDARIO / MISTER LEE / TRANQUILO. YO ME ENCARGO.», fanfarria sintetizada, destello cálido, onda expansiva y estelas doradas. La preferencia de movimiento reducido elimina el destello, la sacudida y las líneas de velocidad.

### Prompt final del sprite

> Use case: stylized-concept. Asset type: transparent PNG run animation sprite sheet for Seven Stars side-scrolling pixel-art game. Input image 1 is the subject reference: Mister Lee, the stocky muscular middle-aged Korean security guard, short neatly slicked black hair, stern clean-shaven face, black short-sleeve collared polo, black trousers, black shoes, dark wristwatch, security lanyard. Input image 2 is the exact illustration style reference only: match its crisp detailed retro 2D pixel art, dark outlines, colored shading, proportions, facing RIGHT. Create a wide sprite sheet with FOUR equally spaced full-body poses in ONE HORIZONTAL ROW, each in its own equal-width cell. Pose 1 running right with long stride; pose 2 running passing stride; pose 3 mid-air jump knees bent; pose 4 powerful running right opposite stride. Same person, outfit, scale, head height and baseline across running frames. Each full body entirely within its cell with clear empty margin. Broad strong body, distinctly older than idols. No sunglasses, no weapon, no blood, no letters, no caption, no frame borders, no glow, no ground, no extra characters. TRUE transparent background. Approximately 1536x640 canvas.

### Prompt final del retrato

> Use case: stylized-concept. Asset type: transparent PNG character portrait for Seven Stars 2D game cinematic ally announcement. Input image 1 is subject reference Mister Lee: stocky muscular middle-aged Korean security guard, short slicked black hair, stern clean-shaven face, black short-sleeve polo with collar, security lanyard and earpiece. Input image 2 is style reference only: match the detailed retro pixel-art portrait, clean dark outlines and refined pixel shading. Chest-up heroic three-quarter portrait facing slightly RIGHT, broad shoulders, composed intimidating protective expression, recognizable mature face and black hair from photograph, no sunglasses. Centered, full head with margin, shoulders and upper chest. TRUE transparent background, no text, no logos, no border, no scenery, no weapons. Square canvas.

## Fondo del valle

- Archivo final: `images/backgrounds/starlit-valley.webp`.
- Generación: herramienta integrada `imagegen`, sin CLI.
- Formato de entrega: WebP, calidad 88.

### Prompt final

> Use case: stylized-concept. Asset type: background artwork for Seven Stars, a polished cute 2D side scrolling running game. Create a wide landscape 1536x1024 illustration: dreamy midnight violet forest valley, distant layered indigo mountains, small glowing lavender plants at the lower edges, thin mist, luminous soft stars and a crescent moon in the upper right, subtle teal glows, restrained warm gold accents. High quality painterly 2D game environment with clean silhouettes and subtle texture, sophisticated anime adventure mood. Center and lower middle are spacious to keep running characters readable. The ground itself will be rendered by game code; image is background scenery only. No characters, no text, no logo, no interface, no frames, no large foreground obstacles. Continuous scenery with dark matching edges suitable for horizontal scrolling. Save the final image for use in the current project.
