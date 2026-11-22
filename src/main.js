import { createClient } from '@supabase/supabase-js';
import './style.css';

const app = document.querySelector('#app');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;
let usuario = null;
let numeroSecreto = 0;
let intentos = 0;
let inicioPartida = 0;
let partidaActiva = false;
let guardandoPartida = false;

function mostrarConfiguracion() {
  app.innerHTML = `
    <main class="contenedor">
      <section class="panel">
        <p class="etiqueta">CAJA FUERTE DIGITAL</p>
        <h1>Configuración pendiente</h1>
        <p>Antes de iniciar la aplicación, configura las variables de Supabase en el archivo <strong>.env</strong>.</p>
        <p class="ayuda">Copia .env.example como .env y añade la URL del proyecto y la clave pública (anon/publishable) de Supabase.</p>
      </section>
    </main>
  `;
}

function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, caracter => {
    const equivalencias = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return equivalencias[caracter];
  });
}

function mostrarLogin() {
  app.innerHTML = `
    <main class="contenedor">
      <section class="panel panel-login">
        <p class="etiqueta">CAJA FUERTE DIGITAL</p>
        <div class="icono-caja">▣</div>
        <h1>Adivina el número</h1>
        <p class="subtitulo">Descubre el número secreto y consigue la mejor puntuación.</p>
        <div class="reglas">
          <h2>¿Cómo se juega?</h2>
          <p>Piensa que hay un número secreto entre 1 y 100. Escribe un número y te diremos si el secreto es mayor o menor. ¡Intenta acertarlo en el menor número de intentos!</p>
        </div>
        <button id="entrarGoogle" class="boton boton-google">
          <span class="google-letra">G</span> Entrar con Google
        </button>
        <p id="mensajeLogin" class="mensaje" aria-live="polite"></p>
      </section>
    </main>
  `;

  document.querySelector('#entrarGoogle').addEventListener('click', iniciarSesionGoogle);
}

async function iniciarSesionGoogle() {
  const mensaje = document.querySelector('#mensajeLogin');
  const boton = document.querySelector('#entrarGoogle');
  boton.disabled = true;
  mensaje.textContent = 'Conectando con Google...';

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });

  if (error) {
    mensaje.textContent = 'No se ha podido iniciar sesión: ' + error.message;
    boton.disabled = false;
  }
}

function mostrarAplicacion() {
  const nombre = usuario.user_metadata?.full_name || usuario.user_metadata?.name || usuario.email;
  const foto = usuario.user_metadata?.avatar_url;

  app.innerHTML = `
    <header class="cabecera">
      <a class="marca" href="#" aria-label="Inicio">▣ <span>CAJA FUERTE</span></a>
      <div class="usuario">
        ${foto ? `<img class="avatar" src="${escaparHTML(foto)}" alt="">` : ''}
        <span class="nombre-usuario">${escaparHTML(nombre)}</span>
        <button id="cerrarSesion" class="boton boton-secundario">Salir</button>
      </div>
    </header>

    <main class="contenido">
      <section class="bienvenida">
        <p class="etiqueta">TU RETO</p>
        <h1>Adivina el número</h1>
        <p>Encuentra el número secreto entre <strong>1 y 100</strong>.</p>
      </section>

      <nav class="pestanas" aria-label="Secciones">
        <button class="pestana activa" id="pestanaJuego">Jugar</button>
        <button class="pestana" id="pestanaHistorial">Mi historial</button>
      </nav>

      <section id="zonaJuego" class="panel panel-juego">
        <div class="numero-grande" id="numeroIntentos">0</div>
        <p class="texto-intentos">intentos realizados</p>
        <p id="instruccion" class="instruccion">Pulsa el botón para comenzar una partida.</p>
        <form id="formularioNumero" class="formulario-numero">
          <label for="numeroUsuario">Tu número</label>
          <div class="fila-formulario">
            <input id="numeroUsuario" type="number" min="1" max="100" placeholder="Del 1 al 100" disabled required>
            <button class="boton boton-principal" id="probarNumero" type="submit" disabled>Probar</button>
          </div>
        </form>
        <p id="mensajeJuego" class="mensaje" aria-live="polite"></p>
        <div class="acciones">
          <button id="nuevaPartida" class="boton boton-principal">Nueva partida</button>
        </div>
        <p class="nota-puntuacion">Puntuación: 100 puntos al primer intento. Se restan 10 puntos por cada intento adicional, hasta un mínimo de 10.</p>
      </section>

      <section id="zonaHistorial" class="panel panel-historial oculto">
        <div class="cabecera-historial">
          <div>
            <p class="etiqueta">TUS RESULTADOS</p>
            <h2>Historial de partidas</h2>
          </div>
          <button id="actualizarHistorial" class="boton boton-secundario">Actualizar</button>
        </div>
        <p id="totalPartidas" class="total-partidas">Cargando partidas...</p>
        <div class="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Resultado</th>
                <th>Puntos</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody id="filasHistorial">
              <tr><td colspan="4">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
        <p id="mensajeHistorial" class="mensaje" aria-live="polite"></p>
      </section>
    </main>
    <footer>Una partida nueva, una oportunidad más.</footer>
  `;

  document.querySelector('#cerrarSesion').addEventListener('click', cerrarSesion);
  document.querySelector('#nuevaPartida').addEventListener('click', nuevaPartida);
  document.querySelector('#formularioNumero').addEventListener('submit', comprobarNumero);
  document.querySelector('#pestanaJuego').addEventListener('click', mostrarZonaJuego);
  document.querySelector('#pestanaHistorial').addEventListener('click', mostrarZonaHistorial);
  document.querySelector('#actualizarHistorial').addEventListener('click', cargarHistorial);

  cargarHistorial();
}

function mostrarZonaJuego() {
  document.querySelector('#zonaJuego').classList.remove('oculto');
  document.querySelector('#zonaHistorial').classList.add('oculto');
  document.querySelector('#pestanaJuego').classList.add('activa');
  document.querySelector('#pestanaHistorial').classList.remove('activa');
}

async function mostrarZonaHistorial() {
  document.querySelector('#zonaJuego').classList.add('oculto');
  document.querySelector('#zonaHistorial').classList.remove('oculto');
  document.querySelector('#pestanaJuego').classList.remove('activa');
  document.querySelector('#pestanaHistorial').classList.add('activa');
  await cargarHistorial();
}

function nuevaPartida() {
  numeroSecreto = Math.floor(Math.random() * 100) + 1;
  intentos = 0;
  inicioPartida = Date.now();
  partidaActiva = true;
  guardandoPartida = false;

  document.querySelector('#numeroIntentos').textContent = intentos;
  document.querySelector('#instruccion').textContent = 'Ya tienes un número secreto. ¡Intenta descubrirlo!';
  document.querySelector('#mensajeJuego').textContent = '';
  document.querySelector('#numeroUsuario').disabled = false;
  document.querySelector('#probarNumero').disabled = false;
  document.querySelector('#numeroUsuario').value = '';
  document.querySelector('#numeroUsuario').focus();
}

async function comprobarNumero(evento) {
  evento.preventDefault();

  if (!partidaActiva || guardandoPartida) {
    return;
  }

  const campoNumero = document.querySelector('#numeroUsuario');
  const numero = Number(campoNumero.value);
  const mensaje = document.querySelector('#mensajeJuego');

  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    mensaje.textContent = 'Escribe un número entero entre 1 y 100.';
    return;
  }

  intentos++;
  document.querySelector('#numeroIntentos').textContent = intentos;

  if (numero < numeroSecreto) {
    mensaje.textContent = 'El número secreto es MAYOR. ¡Prueba otra vez!';
    mensaje.className = 'mensaje pista';
  } else if (numero > numeroSecreto) {
    mensaje.textContent = 'El número secreto es MENOR. ¡Prueba otra vez!';
    mensaje.className = 'mensaje pista';
  } else {
    partidaActiva = false;
    guardandoPartida = true;
    campoNumero.disabled = true;
    document.querySelector('#probarNumero').disabled = true;

    const puntuacion = Math.max(10, 100 - ((intentos - 1) * 10));
    const duracion = Math.max(0, Math.floor((Date.now() - inicioPartida) / 1000));

    mensaje.textContent = `¡Correcto! Has encontrado el número ${numeroSecreto} en ${intentos} intento(s). Has conseguido ${puntuacion} puntos.`;
    mensaje.className = 'mensaje exito';
    document.querySelector('#instruccion').textContent = '¡Partida completada! Puedes comenzar otra cuando quieras.';

    await guardarPartida(puntuacion, duracion);
    guardandoPartida = false;
  }

  campoNumero.value = '';
  if (partidaActiva) {
    campoNumero.focus();
  }
}

async function guardarPartida(puntuacion, duracion) {
  const { error } = await supabase
    .from('partidas')
    .insert({
      resultado: 'Victoria',
      puntuacion: puntuacion,
      duracion: duracion,
      intentos: intentos
    });

  if (error) {
    document.querySelector('#mensajeJuego').textContent += ' ATENCIÓN: no se ha podido guardar la partida. ' + error.message;
    document.querySelector('#mensajeJuego').className = 'mensaje error';
  } else {
    await cargarHistorial();
  }
}

async function cargarHistorial() {
  const filas = document.querySelector('#filasHistorial');
  const total = document.querySelector('#totalPartidas');
  const mensaje = document.querySelector('#mensajeHistorial');

  filas.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';
  mensaje.textContent = '';

  const { data, error } = await supabase
    .from('partidas')
    .select('id, fecha, resultado, puntuacion, duracion')
    .order('fecha', { ascending: false });

  if (error) {
    filas.innerHTML = '<tr><td colspan="4">No se ha podido cargar el historial.</td></tr>';
    total.textContent = 'No se ha podido consultar el total.';
    mensaje.textContent = error.message;
    return;
  }

  total.textContent = `Total de partidas jugadas: ${data.length}`;

  if (data.length === 0) {
    filas.innerHTML = '<tr><td colspan="4">Todavía no has terminado ninguna partida.</td></tr>';
    return;
  }

  filas.innerHTML = data.map(partida => {
    const fecha = new Date(partida.fecha).toLocaleString('es-ES');
    const duracion = `${partida.duracion} s`;
    return `
      <tr>
        <td>${escaparHTML(fecha)}</td>
        <td><span class="resultado">${escaparHTML(partida.resultado)}</span></td>
        <td>${escaparHTML(partida.puntuacion)}</td>
        <td>${escaparHTML(duracion)}</td>
      </tr>
    `;
  }).join('');
}

async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    alert('No se ha podido cerrar la sesión: ' + error.message);
  }
}

async function iniciarAplicacion() {
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('TU-PROYECTO')) {
    mostrarConfiguracion();
    return;
  }

  supabase = createClient(supabaseUrl, supabaseKey);

  const { data: { session } } = await supabase.auth.getSession();
  usuario = session?.user ?? null;

  if (usuario) {
    mostrarAplicacion();
  } else {
    mostrarLogin();
  }

  supabase.auth.onAuthStateChange((_evento, sessionActual) => {
    usuario = sessionActual?.user ?? null;
    if (usuario) {
      mostrarAplicacion();
    } else {
      partidaActiva = false;
      mostrarLogin();
    }
  });
}

iniciarAplicacion();
