
import { createClient } from '@supabase/supabase-js';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase;
let usuario = null;

let habitacionActual = 0;
let vidas = 3;
let puntuacion = 1000;
let tiempoRestante = 600;
let intentos = 0;
let pistasUtilizadas = 0;
let cifras = [];

let partidaActiva = false;
let continuarPendiente = false;
let pistaUtilizadaEnSala = false;
let guardandoPartida = false;

let temporizador;

// ENIGMAS

const habitaciones = [
    {
        titulo: 'HABITACIÓN 1 - EL CÓDIGO',
        descripcion: 'El primer panel de seguridad está bloqueado.',
        enigma: `
            <p>Observa la secuencia:</p>
            <h2>1 - 3 - 5 - ?</h2>
            <p>¿Qué número continúa la secuencia?</p>
            <p>La respuesta será la primera cifra del código final.</p>
        `,
        respuestas: ['7'],
        cifra: '7',
        pista: 'Los números aumentan de dos en dos.',
        tipo: 'numero'
    },

    {
        titulo: 'HABITACIÓN 2 - LÓGICA',
        descripcion: 'Un ordenador bloquea la puerta con una secuencia matemática.',
        enigma: `
            <p>Descifra la secuencia:</p>
            <h2>2 - 6 - 12 - 20 - 30 - ?</h2>
            <p>¿Cuál es el siguiente número?</p>
            <p>Suma las cifras del resultado para conseguir la segunda cifra.</p>
        `,
        respuestas: ['42'],
        cifra: '6',
        pista: 'Las diferencias son 4, 6, 8, 10... ¿Cuál será la siguiente diferencia?',
        tipo: 'numero'
    },

    {
        titulo: 'HABITACIÓN 3 - EL ACERTIJO',
        descripcion: 'Una voz aparece en el sistema de comunicación.',
        enigma: `
            <p>Resuelve el acertijo:</p>
            <h2>Cuanto más calor recibo, más pequeño me hago.</h2>
            <p>¿Qué soy?</p>
            <p>El número de letras de la respuesta será la tercera cifra.</p>
        `,
        respuestas: ['hielo'],
        cifra: '5',
        pista: 'Soy agua congelada.',
        tipo: 'texto'
    },

    {
        titulo: 'HABITACIÓN 4 - LOS COLORES',
        descripcion: 'El panel de colores controla el acceso a la última sala.',
        enigma: `
            <p>Observa el patrón:</p>
            <h2>ROJO - AZUL - ROJO - AZUL - ROJO - ?</h2>
            <p>¿Qué color continúa?</p>
            <p>El número de letras de la respuesta será la cuarta cifra.</p>
        `,
        respuestas: ['azul'],
        cifra: '4',
        pista: 'Solo aparecen dos colores alternándose.',
        tipo: 'texto'
    }
];

// NORMALIZAR RESPUESTAS

function normalizarRespuesta(respuesta) {
    return respuesta
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// INICIAR SESIÓN

async function iniciarSesionGoogle() {
    if (!supabase) {
        return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });

    if (error) {
        document.querySelector('#estadoLogin').textContent =
            'Error al iniciar sesión: ' + error.message;
    }
}

// CERRAR SESIÓN

async function cerrarSesion() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        alert('Error al cerrar sesión: ' + error.message);
    }
}

// ACTUALIZAR USUARIO

function actualizarUsuario() {
    const login = document.querySelector('#login');
    const logout = document.querySelector('#logout');
    const nuevaPartida = document.querySelector('#nuevaPartida');
    const nombreUsuario = document.querySelector('#nombreUsuario');

    if (usuario) {
        login.hidden = true;
        logout.hidden = false;
        nuevaPartida.disabled = false;

        if (nombreUsuario) {
            nombreUsuario.textContent =
                usuario.user_metadata?.full_name ||
                usuario.user_metadata?.name ||
                usuario.email;
        }

    } else {
        login.hidden = false;
        logout.hidden = true;
        nuevaPartida.disabled = true;

        if (nombreUsuario) {
            nombreUsuario.textContent = '';
        }

        document.querySelector('#listaHistorial').innerHTML =
            '<p>Inicia sesión para consultar tus partidas.</p>';
    }
}

// INICIAR PARTIDA

function nuevaPartida() {
    if (!usuario) {
        alert('Primero debes iniciar sesión con Google.');
        return;
    }

    clearInterval(temporizador);

    habitacionActual = 0;
    vidas = 3;
    puntuacion = 1000;
    tiempoRestante = 600;
    intentos = 0;
    pistasUtilizadas = 0;
    cifras = [];

    partidaActiva = true;
    continuarPendiente = false;
    pistaUtilizadaEnSala = false;
    guardandoPartida = false;

    document.querySelector('#inicio').hidden = true;
    document.querySelector('#juego').hidden = false;
    document.querySelector('#final').hidden = true;

    actualizarEstadisticas();
    mostrarHabitacion();

    temporizador = setInterval(() => {
        tiempoRestante--;

        actualizarEstadisticas();

        if (tiempoRestante <= 0) {
            finalizarPartida(false, 'Se ha agotado el tiempo.');
        }
    }, 1000);
}

// ACTUALIZAR ESTADÍSTICAS

function actualizarEstadisticas() {
    const minutos = Math.floor(tiempoRestante / 60);
    const segundos = tiempoRestante % 60;

    document.querySelector('#tiempo').textContent =
        `${minutos}:${String(segundos).padStart(2, '0')}`;

    document.querySelector('#vidas').textContent =
        '❤️'.repeat(vidas) + '🖤'.repeat(3 - vidas);

    document.querySelector('#puntuacion').textContent = puntuacion;

    document.querySelector('#habitacion').textContent =
        `${habitacionActual + 1} / 5`;
}

// MOSTRAR HABITACIÓN

function mostrarHabitacion() {
    continuarPendiente = false;
    pistaUtilizadaEnSala = false;

    const titulo = document.querySelector('#tituloSala');
    const descripcion = document.querySelector('#descripcionSala');
    const enigma = document.querySelector('#enigma');
    const mensaje = document.querySelector('#mensaje');
    const respuesta = document.querySelector('#respuestaUsuario');
    const comprobar = document.querySelector('#comprobar');
    const pista = document.querySelector('#pista');

    mensaje.textContent = '';
    mensaje.className = '';

    respuesta.disabled = false;
    respuesta.value = '';
    comprobar.disabled = false;
    comprobar.textContent = 'COMPROBAR';

    pista.disabled = false;
    pista.hidden = false;
    pista.textContent = 'SOLICITAR PISTA (-50 PUNTOS)';

    if (habitacionActual < 4) {
        const sala = habitaciones[habitacionActual];

        titulo.textContent = sala.titulo;
        descripcion.textContent = sala.descripcion;
        enigma.innerHTML = sala.enigma;

    } else {
        titulo.textContent = 'HABITACIÓN 5 - ESCAPE FINAL';
        descripcion.textContent =
            'Has conseguido las cuatro cifras. Introduce el código para desbloquear la salida.';

        enigma.innerHTML = `
            <h2>EL CÓDIGO FINAL</h2>
            <p>Introduce las cuatro cifras que has conseguido en las habitaciones anteriores.</p>
            <p>El orden importa.</p>
        `;
    }

    respuesta.focus();

    actualizarEstadisticas();
}

// COMPROBAR RESPUESTA

function comprobarRespuesta() {
    if (!partidaActiva || guardandoPartida) {
        return;
    }

    if (continuarPendiente) {
        continuarHabitacion();
        return;
    }

    const campo = document.querySelector('#respuestaUsuario');
    const respuesta = normalizarRespuesta(campo.value);

    if (respuesta === '') {
        document.querySelector('#mensaje').textContent =
            'Escribe una respuesta antes de comprobarla.';
        return;
    }

    intentos++;

    if (habitacionActual < 4) {
        comprobarEnigma(respuesta);
    } else {
        comprobarCodigoFinal(respuesta);
    }
}

// COMPROBAR ENIGMA

function comprobarEnigma(respuesta) {
    const sala = habitaciones[habitacionActual];

    const correcto = sala.respuestas.some(
        solucion => normalizarRespuesta(solucion) === respuesta
    );

    if (correcto) {
        resolverHabitacion(sala.cifra);
    } else {
        respuestaIncorrecta();
    }
}

// RESOLVER HABITACIÓN

function resolverHabitacion(cifra) {
    cifras.push(cifra);

    const mensaje = document.querySelector('#mensaje');
    const respuesta = document.querySelector('#respuestaUsuario');
    const comprobar = document.querySelector('#comprobar');
    const pista = document.querySelector('#pista');

    mensaje.textContent =
        `¡Correcto! Has conseguido la cifra ${cifra}. Pulsa CONTINUAR para avanzar.`;

    mensaje.className = 'exito';

    respuesta.disabled = true;
    comprobar.textContent = 'CONTINUAR';
    pista.disabled = true;

    continuarPendiente = true;
}

// CONTINUAR A LA SIGUIENTE HABITACIÓN

function continuarHabitacion() {
    habitacionActual++;

    if (habitacionActual >= 5) {
        mostrarHabitacion();
        return;
    }

    mostrarHabitacion();
}

// COMPROBAR CÓDIGO FINAL

function comprobarCodigoFinal(respuesta) {
    const codigo = cifras.join('');

    if (respuesta === codigo) {
        finalizarPartida(true, '¡Has desbloqueado la salida del laboratorio!');
    } else {
        respuestaIncorrecta();
    }
}

// RESPUESTA INCORRECTA

function respuestaIncorrecta() {
    vidas--;
    puntuacion = Math.max(0, puntuacion - 100);

    const mensaje = document.querySelector('#mensaje');

    mensaje.textContent =
        `Respuesta incorrecta. Pierdes una vida y 100 puntos. Te quedan ${vidas} vidas.`;

    mensaje.className = 'error';

    document.querySelector('#respuestaUsuario').value = '';

    actualizarEstadisticas();

    if (vidas <= 0) {
        finalizarPartida(false, 'Te has quedado sin vidas. El laboratorio te ha atrapado.');
    }
}

// SOLICITAR PISTA

function solicitarPista() {
    if (!partidaActiva || guardandoPartida || pistaUtilizadaEnSala) {
        return;
    }

    pistaUtilizadaEnSala = true;
    pistasUtilizadas++;

    puntuacion = Math.max(0, puntuacion - 50);

    const mensaje = document.querySelector('#mensaje');

    if (habitacionActual < 4) {
        mensaje.textContent = habitaciones[habitacionActual].pista;
    } else {
        mensaje.textContent =
            'Recuerda: las cuatro cifras están en el orden en el que las conseguiste.';
    }

    mensaje.className = 'pista';

    document.querySelector('#pista').disabled = true;

    actualizarEstadisticas();
}

// FINALIZAR PARTIDA

async function finalizarPartida(victoria, texto) {
    if (guardandoPartida || !partidaActiva) {
        return;
    }

    partidaActiva = false;
    guardandoPartida = true;

    clearInterval(temporizador);

    if (victoria) {
        puntuacion += tiempoRestante * 2;
    }

    document.querySelector('#juego').hidden = true;
    document.querySelector('#final').hidden = false;

    document.querySelector('#tituloFinal').textContent =
        victoria ? '¡ESCAPASTE!' : 'MISIÓN FALLIDA';

    document.querySelector('#mensajeFinal').textContent = texto;

    document.querySelector('#puntuacionFinal').textContent =
        `Puntuación final: ${puntuacion} puntos`;

    await guardarPartida(victoria);

    guardandoPartida = false;
}

// GUARDAR PARTIDA EN SUPABASE

async function guardarPartida(victoria) {
    const duracion = 600 - tiempoRestante;

    const { error } = await supabase
        .from('partidas')
        .insert({
            user_id: usuario.id,
            resultado: victoria ? 'Victoria' : 'Derrota',
            puntuacion: puntuacion,
            duracion: duracion,
            intentos: intentos
        });

    if (error) {
        document.querySelector('#mensajeFinal').textContent +=
            ' No se ha podido guardar la partida: ' + error.message;
    } else {
        await cargarHistorial();
    }
}

// CARGAR HISTORIAL

async function cargarHistorial() {
    const lista = document.querySelector('#listaHistorial');

    if (!usuario) {
        lista.innerHTML = '<p>Inicia sesión para consultar tu historial.</p>';
        return;
    }

    lista.innerHTML = '<p>Cargando partidas...</p>';

    const { data, error } = await supabase
        .from('partidas')
        .select('id, fecha, resultado, puntuacion, duracion, intentos')
        .order('fecha', { ascending: false });

    if (error) {
        lista.innerHTML =
            '<p>No se ha podido cargar el historial: ' +
            escaparHTML(error.message) + '</p>';

        return;
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Todavía no has jugado ninguna partida.</p>';
        return;
    }

    lista.innerHTML = data.map(partida => {
        const fecha = new Date(partida.fecha).toLocaleString('es-ES');

        const minutos = Math.floor(partida.duracion / 60);
        const segundos = partida.duracion % 60;

        const duracion =
            `${minutos}:${String(segundos).padStart(2, '0')}`;

        return `
            <div>
                <h3>${escaparHTML(partida.resultado)}</h3>
                <p>Fecha: ${escaparHTML(fecha)}</p>
                <p>Puntuación: ${escaparHTML(partida.puntuacion)}</p>
                <p>Duración: ${escaparHTML(duracion)}</p>
                <p>Intentos: ${escaparHTML(partida.intentos)}</p>
            </div>
        `;
    }).join('');
}

// ESCAPAR HTML

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

// VOLVER AL INICIO

function volverInicio() {
    clearInterval(temporizador);

    partidaActiva = false;
    guardandoPartida = false;

    document.querySelector('#final').hidden = true;
    document.querySelector('#juego').hidden = true;
    document.querySelector('#inicio').hidden = false;

    actualizarEstadisticas();
}

// CONFIGURAR EVENTOS

document.querySelector('#login').addEventListener('click', iniciarSesionGoogle);

document.querySelector('#logout').addEventListener('click', cerrarSesion);

document.querySelector('#nuevaPartida').addEventListener('click', nuevaPartida);

document.querySelector('#comprobar').addEventListener('click', comprobarRespuesta);

document.querySelector('#pista').addEventListener('click', solicitarPista);

document.querySelector('#volverInicio').addEventListener('click', volverInicio);

document.querySelector('#respuestaUsuario').addEventListener('keydown', evento => {
    if (evento.key === 'Enter') {
        comprobarRespuesta();
    }
});

// INICIAR APLICACIÓN

async function iniciarAplicacion() {
    const login = document.querySelector('#login');
    const nuevaPartida = document.querySelector('#nuevaPartida');

    if (!supabaseUrl || !supabaseKey) {
        document.querySelector('#estadoLogin').textContent =
            'Configuración de Supabase pendiente.';

        login.disabled = true;
        nuevaPartida.disabled = true;

        return;
    }

    supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { session } } = await supabase.auth.getSession();

    usuario = session?.user ?? null;

    actualizarUsuario();

    if (usuario) {
        cargarHistorial();
    }

    supabase.auth.onAuthStateChange((_evento, sessionActual) => {
        usuario = sessionActual?.user ?? null;

        actualizarUsuario();

        if (usuario) {
            cargarHistorial();
        }
    });
}

// INICIO

iniciarAplicacion();