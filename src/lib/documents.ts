// Builds the printable documents. Everything happens in the browser:
// no seed phrase word ever enters or leaves this code.

export const WORD_COUNTS = [12, 15, 18, 21, 24] as const;
export type WordCount = (typeof WORD_COUNTS)[number];

export interface Seed {
  words: WordCount;
  passphrase: boolean;
}

export interface Config {
  seeds: Seed[];
  /** Locations for the seeds. Each one keeps a copy of all of them: copies per seed = places. */
  places: number;
  /** Locations for the passphrases, separate from the seed locations. Each one keeps all passphrases. */
  ppPlaces: number;
  /** How many trusted-person entries there will be; filled in by hand. */
  people: number;
  rabby: boolean;
  exchanges: boolean;
}

export const MAX_SEEDS = 20;
export const MAX_PLACES = 5;
export const MAX_PP_PLACES = 3;
export const MAX_PEOPLE = 8;

export function newSeed(): Seed {
  return {
    words: 24,
    passphrase: false,
  };
}

export function defaultConfig(): Config {
  return {
    seeds: [newSeed()],
    places: 2,
    ppPlaces: 1,
    people: 2,
    rabby: true,
    exchanges: true,
  };
}

const ESC: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

// Location numbering: seed locations first (1…places), then passphrase locations.
const ppPlaceNo = (cfg: Config, c: number) => cfg.places + c + 1;

/** A labelled line; if there is a value it is printed, otherwise a blank line is left to write on. */
function field(label: string, value = "", half = false) {
  const v = value.trim();
  return `<p class="f${half ? " half" : ""}"><span class="fl">${label}</span>${
    v ? `<span class="fv">${esc(v)}</span>` : `<span class="ln"></span>`
  }</p>`;
}
/** Large line for the alias: it identifies each seed across all documents. */
const aliasLine = (label = "Alias:") => `<p class="f alias"><span class="fl">${label}</span><span class="ln"></span></p>`;
const blank = (n = 1) => Array.from({ length: n }, () => `<p class="f"><span class="ln"></span></p>`).join("");

const anyPassphrase = (cfg: Config) => cfg.seeds.some((s) => s.passphrase);

/* ------------------------------------------------------------------ */
/* 1. Recovery instructions for heirs                                  */
/* ------------------------------------------------------------------ */

function rabbySteps(pp: boolean) {
  return `
<h2>Procedimiento de recuperación con Rabby</h2>
<p>Rabby es una wallet gratuita que, al importar una frase semilla, muestra de golpe el saldo en todas las redes compatibles con Ethereum (Ethereum, Arbitrum, Base, BNB Chain, Polygon…). Es la forma más sencilla de ver qué hay en cada semilla.</p>
<p><b>Importante:</b> al escribir una semilla en un ordenador conectado a internet, esa semilla deja de considerarse segura. Por eso, en cuanto veas los fondos, muévelos a una wallet nueva.</p>
<ol>
  <li><b>Usa un ordenador de confianza</b>, actualizado y a ser posible no compartido.</li>
  <li><b>Instala Rabby solo desde su web oficial, rabby.io</b>, y desde ahí la extensión para Chrome o Brave (o la app del móvil). No uses enlaces de anuncios de Google: hay copias falsas que roban la semilla.</li>
  <li><b>Abre Rabby y elige importar una wallet existente con frase semilla</b> («Seed Phrase»). Crea una contraseña para Rabby; solo protege la extensión en ese ordenador.</li>
  <li><b>Escribe las palabras de la Hoja de backup en orden</b>, solo dentro de Rabby. Nunca en otra web, en un buscador ni en un documento.</li>
  ${
    pp
      ? `<li><b>Si la ficha de la semilla indica passphrase</b>, ten a mano su hoja de passphrase y escríbela, exactamente igual, en la opción de passphrase al importar. Sin ella verás una wallet distinta, normalmente vacía. Si no encuentras esa opción, recupera la semilla en una hardware wallet nueva, donde la passphrase se introduce en el propio dispositivo.</li>`
      : ""
  }
  <li><b>Importa varias direcciones de esa semilla.</b> Rabby te deja elegir cuáles: marca al menos las 5 primeras, porque a veces se usan varias.</li>
  <li><b>Revisa el saldo de cada dirección.</b> Rabby suma automáticamente lo que hay en cada red. Anota lo que encuentres.</li>
  <li><b>Si la Hoja de backup menciona Bitcoin, Solana u otras redes no compatibles con Ethereum</b>, Rabby no las muestra: usa para ellas la wallet que indique la hoja.</li>
  <li><b>Mueve los fondos</b> a una wallet nueva creada por ti (mejor una hardware wallet comprada al fabricante) o a tu cuenta en un exchange regulado. Haz primero un envío de prueba pequeño y comprueba que llega.</li>
  <li><b>Al terminar, elimina la wallet importada de Rabby</b> y guarda la Hoja de backup en lugar seguro, o destrúyela si ya no queda nada en esa semilla.</li>
</ol>`;
}

function hardwareSteps(pp: boolean) {
  return `
<h2>Procedimiento de recuperación</h2>
<p>Para recuperar una semilla hace falta su Hoja de backup y una hardware wallet nueva o reseteada${pp ? " y, si la ficha lo indica, su hoja de passphrase" : ""}.</p>
<ol>
  <li><b>Consigue un dispositivo de confianza.</b> Una hardware wallet nueva, comprada directamente al fabricante. Nunca uses una web para introducir la semilla.</li>
  <li><b>Elige «Recuperar wallet»</b> en el dispositivo e introduce las palabras en orden, directamente en su pantalla.</li>
  ${
    pp
      ? `<li><b>Introduce la passphrase</b> si la ficha la indica, exactamente igual. Sin ella verás una wallet distinta, normalmente vacía.</li>`
      : ""
  }
  <li><b>Conecta la app que indique la Hoja de backup</b> (Ledger Live, Trezor Suite, Rabby…) y revisa el saldo de cada red.</li>
  <li><b>Mueve los fondos</b> a una wallet nueva creada por ti o a tu cuenta en un exchange regulado. Haz primero un envío de prueba pequeño.</li>
</ol>`;
}

export function instructionsDoc(cfg: Config): string {
  const pp = anyPassphrase(cfg);

  const people = Array.from(
    { length: cfg.people },
    (_, i) => `
<div class="entry">
  <h3>Persona ${i + 1}</h3>
  ${field("Nombre:")}
  ${field("Relación:", "", true)}${field("Teléfono:", "", true)}
  ${field("Qué sabe o guarda:")}
</div>`,
  ).join("");

  const placeEntry = (no: number, holds: string) => `
<div class="entry">
  <h3>Lugar n.º ${no} <span class="tag">(${holds})</span></h3>
  ${field("Dónde es:")}
  ${blank(1)}
  ${field("Cómo se accede (llave, código, a quién pedirlo):")}
</div>`;
  const ppSeeds = cfg.seeds.filter((s) => s.passphrase).length;
  const places =
    Array.from({ length: cfg.places }, (_, i) =>
      placeEntry(i + 1, `copia ${i + 1} de ${cfg.seeds.length === 1 ? "la frase semilla" : `las ${cfg.seeds.length} frases semilla`}`),
    ).join("") +
    (pp
      ? Array.from({ length: cfg.ppPlaces }, (_, c) =>
          placeEntry(ppPlaceNo(cfg, c), `copia ${c + 1} de ${ppSeeds === 1 ? "la passphrase" : `las ${ppSeeds} passphrases`}`),
        ).join("")
      : "");
  const seedEntries = cfg.seeds
    .map((s) => {
      const copies = Array.from({ length: cfg.places }, (_, c) =>
        field(`Hoja de backup ${c + 1} de ${cfg.places} está en:`, `Lugar n.º ${c + 1}`),
      ).join("");
      const pps = s.passphrase
        ? Array.from({ length: cfg.ppPlaces }, (_, c) =>
            field(`Passphrase, copia ${c + 1} de ${cfg.ppPlaces}, está en:`, `Lugar n.º ${ppPlaceNo(cfg, c)}`),
          ).join("")
        : "";
      return `
<div class="entry">
  <h3>Frase semilla <span class="tag">(${s.words} palabras${s.passphrase ? ", con passphrase" : ""})</span></h3>
  ${aliasLine()}
  ${field("Observaciones:")}
  ${blank(1)}
  ${copies}
  ${pps}
</div>`;
    })
    .join("");

  return `
<section class="doc-page flow">
  <h1>Instrucciones de recuperación para mis herederos</h1>
  <p class="meta">Documento de: ________________________________ Fecha: ________________</p>

  <h2>Aviso importante</h2>
  <p class="lead">Si estás leyendo esto, es porque no puedo gestionar mis criptomonedas. Aquí te explico qué tengo, dónde están las piezas y cómo recuperarlas paso a paso.</p>
  <p><b>Este documento no contiene ninguna frase semilla ni clave privada.</b> Esas están en hojas aparte, escritas a mano y guardadas en los lugares que indico al final. Quien tiene esas hojas tiene el dinero: trátalas como si fueran billetes.</p>
  <p>No hay prisa. Los fondos no caducan ni desaparecen mientras nadie más vea las semillas.</p>

  <h2>Primeros pasos</h2>
  <p>Antes de tocar nada, lee el documento entero una vez. La regla más importante es la primera.</p>
  <ol>
    <li><b>No compartas las hojas de backup con nadie</b>, tampoco con supuestos expertos, empresas de recuperación ni personas que te contacten por redes. Nadie legítimo necesita ver la semilla.</li>
    <li><b>Reúne las piezas</b> siguiendo la sección «Frases semilla y dónde están», al final de este documento${pp ? ". Las passphrases están en hojas propias, guardadas aparte de las semillas" : ""}.</li>
    <li><b>Sigue el procedimiento de recuperación</b> de este documento.</li>
    <li><b>Si no te ves capaz</b>, busca ayuda de alguien de mucha confianza y con experiencia, y hazlo juntos, delante de ti, sin que esa persona se lleve fotos ni copias.</li>
    <li><b>Una vez recuperados</b>, mueve los fondos a wallets nuevas generadas por ti, o véndelos en un exchange regulado si es lo que prefieres. Consulta con un asesor fiscal la declaración de la herencia.</li>
  </ol>

  <h2>Cuidado con las estafas</h2>
  <p>Cuando se sabe que alguien ha fallecido con criptomonedas, aparecen estafadores. Desconfía siempre de:</p>
  <ul>
    <li>Cualquier persona, web o app que te pida escribir la frase semilla. Ningún servicio legítimo la necesita.</li>
    <li>«Servicios de recuperación» que te contactan ellos primero, por email, teléfono, WhatsApp, Telegram o redes sociales.</li>
    <li>Supuesto soporte de Ledger, Trezor, MetaMask o un exchange. Nunca llaman ni escriben por iniciativa propia.</li>
    <li>Hardware wallets de segunda mano, regaladas o compradas a terceros. Solo directamente al fabricante.</li>
    <li>Prisas y urgencias: «los fondos se van a bloquear», «hay que actuar hoy». Es la señal típica de estafa.</li>
    <li>Ofertas para comprarte las criptomonedas «por encima de mercado» o pagos por adelantado para «liberar» fondos.</li>
  </ul>

  ${cfg.rabby ? rabbySteps(pp) : hardwareSteps(pp)}

  ${
    cfg.people
      ? `<h2>Personas de confianza</h2>
  <p>Personas en las que confío y a las que puedes acudir: saben que existe este documento o guardan alguna Hoja de backup.</p>
  ${people}`
      : ""
  }

  <h2>Frases semilla y dónde están</h2>
  <p>Si has leído todo lo anterior, ya sabes cómo protegerte de estafas y cómo recuperar los fondos. Ahora sí: aquí está qué frases semilla existen y dónde está cada Hoja de backup.</p>
  <p>Cada ficha es una frase semilla y se identifica por su alias, el mismo que está escrito en sus Hojas de backup, donde están las palabras y qué se ha usado con esa semilla. Los lugares se indican por número: qué es cada uno está en la sección «Lugares», justo después.</p>
  ${seedEntries}
  <h2>Lugares</h2>
  <p>${
    cfg.places === 1
      ? "Todas las Hojas de backup están juntas en un mismo lugar."
      : `Cada lugar guarda una copia de todas las frases semilla, así que basta con llegar a uno de los ${cfg.places} para recuperarlas.`
  }${pp ? " Las passphrases están en lugares propios, separados de las semillas." : ""} El número de lugar es el que aparece en cada ficha de arriba.</p>
  ${places}
  ${
    cfg.exchanges
      ? `<p>Si tengo dinero en exchanges (Binance, Coinbase, Kraken…), no hay semilla: hay que reclamarlo al exchange con el certificado de defunción y la documentación de la herencia.</p>`
      : ""
  }
  <p class="warn">Guarda este documento en un lugar distinto de las Hojas de backup: juntos darían acceso completo a quien los encontrara.</p>
</section>`;
}

/* ------------------------------------------------------------------ */
/* 2. Backup sheets (one page per copy of each seed)                   */
/* ------------------------------------------------------------------ */

const usageSheet = (title: string, items: string[]) => `
<section class="doc-page sheet">
  <h1>${title}</h1>
  <p class="warn">Imprime estas hojas en blanco y rellénalas solo a mano. Nunca escribas una frase semilla${title.includes("passphrase") ? " ni una passphrase" : ""} en un ordenador, un móvil o una web.</p>
  <ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol>
</section>`;

function wordGrid(count: number) {
  const rows = Math.ceil(count / 2);
  const cells = Array.from({ length: count }, (_, i) => `<div class="word"><b>${i + 1}.</b><span></span></div>`).join("");
  return `<div class="words" style="grid-template-rows: repeat(${rows}, auto)">${cells}</div>`;
}

export function backupDoc(cfg: Config): string {
  const intro = usageSheet("Hojas de backup de frases semilla", [
    "Hay una hoja por cada frase semilla y lugar, ordenadas por lugar: cada lugar guarda una copia de todas las semillas.",
    "Escribe el alias de la semilla en cada hoja, exactamente el mismo que en su ficha de las <i>Instrucciones de recuperación para mis herederos</i>: es lo que las relaciona.",
    "Escribe con bolígrafo de tinta permanente y mayúsculas claras. Comprueba cada palabra dos veces contra la pantalla del dispositivo.",
    "Cada hoja indica en qué lugar va. Qué es cada lugar se describe en las instrucciones, sección «Lugares».",
    "Si quieres, pasa la semilla también a una placa de acero: el papel no resiste fuego ni agua.",
    "Destruye borradores y hojas mal escritas triturándolas o quemándolas.",
  ]);

  const sheets = Array.from({ length: cfg.places }, (_, c) =>
    cfg.seeds.map(
      (s) => `
<section class="doc-page sheet">
  <div class="sheet-head">
    <h1>Frase semilla</h1>
    <span class="copy">Hoja de backup ${c + 1} de ${cfg.places} · Lugar n.º ${c + 1}</span>
  </div>
  ${aliasLine()}
  ${field("Fecha:", "", true)}${field("Palabras:", String(s.words), true)}
  ${field("Qué se ha usado con esta semilla (wallets, apps, redes):")}
  ${blank(2)}
  ${field("Primera dirección (primeros y últimos 6 caracteres):")}
  ${s.passphrase ? `<p class="warn">Esta semilla usa passphrase. Está en su propia hoja, guardada en otro lugar.</p>` : ""}
  <h3>Palabras</h3>
  ${wordGrid(s.words)}
  <p class="check"><i></i><span>Verificada en el dispositivo. Fecha: ____________________</span></p>
  <p class="foot">Quien tiene esta hoja tiene los fondos. No la fotografíes ni la escribas en ningún dispositivo.</p>
</section>`,
    ),
  )
    .flat()
    .join("");

  return intro + sheets;
}

/* ------------------------------------------------------------------ */
/* 3. Passphrase sheets (only if some seed uses one)                   */
/* ------------------------------------------------------------------ */

export function passphraseDoc(cfg: Config): string {
  if (!anyPassphrase(cfg)) return "";
  const intro = usageSheet("Hojas de passphrase", [
    "Hay una hoja por cada semilla con passphrase y lugar de passphrases, ordenadas por lugar.",
    "Los lugares de passphrases son distintos de los de las Hojas de backup. Juntas en el mismo sitio, la passphrase no protege nada.",
    "Escríbela exactamente igual: mayúsculas, minúsculas, espacios, acentos y símbolos cuentan.",
    "Si la pierdes, pierdes los fondos aunque tengas la semilla. Comprueba que funciona antes de meter dinero.",
  ]);

  const sheets = Array.from({ length: cfg.ppPlaces }, (_, c) =>
    cfg.seeds.map((s) =>
      s.passphrase
        ? `
<section class="doc-page sheet">
  <div class="sheet-head">
    <h1>Passphrase</h1>
    <span class="copy">Copia ${c + 1} de ${cfg.ppPlaces} · Lugar n.º ${ppPlaceNo(cfg, c)}</span>
  </div>
  ${aliasLine("Alias de la semilla:")}
  ${field("Fecha:", "", true)}${field("N.º de caracteres:", "", true)}
  ${field("¿Lleva espacios, acentos o símbolos?")}
  <h3>Passphrase, exactamente igual</h3>
  <div class="box"></div>
  <div class="box"></div>
  <p class="check"><i></i><span>Comprobada en el dispositivo. Fecha: ____________________</span></p>
  <p class="foot">Guárdala lejos de las Hojas de backup de esta semilla.</p>
</section>`
        : "",
    ),
  )
    .flat()
    .join("");

  return intro + sheets;
}
