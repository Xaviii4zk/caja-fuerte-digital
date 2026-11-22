# Caja fuerte digital - Adivina el número

He desarrollado este videojuego web individual utilizando HTML5, CSS3, JavaScript Vanilla, Vite, Supabase Auth y PostgreSQL.

## Reglas del juego

1. Inicio sesión con Google.
2. Pulso **Nueva partida**.
3. Intento adivinar el número secreto entre 1 y 100.
4. El juego me indica si el número secreto es mayor o menor.
5. Cuando acierto, la partida termina y se calcula mi puntuación.
6. El resultado se guarda en PostgreSQL y aparece en **Mi historial**.

La puntuación comienza en 100 puntos y resta 10 puntos por cada intento adicional, con un mínimo de 10 puntos.

## Tecnologías utilizadas

- HTML5 y CSS3.
- JavaScript Vanilla.
- Vite.
- Supabase Auth con Google OAuth.
- PostgreSQL mediante Supabase.
- Row Level Security (RLS).

## Requisitos previos

Para ejecutar el proyecto localmente necesito:

- Node.js instalado.
- Una cuenta de Supabase.
- Un proyecto de Google Cloud para configurar OAuth.
- Una cuenta de GitHub.

## Instalación local

1. Clono el repositorio o descargo el proyecto.
2. Abro una terminal en la carpeta del proyecto.
3. Instalo las dependencias:

   ```bash
   npm install
   ```

4. Copio el archivo `.env.example` y creo un archivo llamado `.env`.
5. Completo las variables de entorno con los datos de mi proyecto de Supabase:

   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
   ```

6. En Supabase, abro **SQL Editor**, creo una consulta nueva, copio el contenido de `supabase.sql` y lo ejecuto.
7. Inicio el servidor de desarrollo:

   ```bash
   npm run dev
   ```

8. Abro en el navegador la dirección local que me muestra Vite.

## Configuración de Google OAuth

1. En Google Cloud Console, creo o selecciono un proyecto.
2. Configuro la pantalla de consentimiento OAuth.
3. Creo un cliente OAuth de tipo **Aplicación web**.
4. En los URI de redireccionamiento autorizados de Google, añado la URL de callback que me muestra Supabase en **Authentication > Providers > Google**. Normalmente tiene este formato:

   ```text
   https://TU-PROYECTO.supabase.co/auth/v1/callback
   ```

5. Copio el Client ID y el Client Secret de Google en el proveedor Google de Supabase y lo activo.
6. En Supabase, entro en **Authentication > URL Configuration**.
7. Configuro la Site URL y las Redirect URLs permitidas para el entorno local y la aplicación desplegada.

## Base de datos y seguridad

La tabla `public.partidas` almacena las partidas finalizadas, incluyendo el identificador del usuario, la fecha, el resultado, la puntuación, la duración y los intentos.

He incluido el archivo `supabase.sql` con las instrucciones necesarias para crear la tabla y configurar la seguridad.

Utilizo Row Level Security (RLS) para que cada usuario autenticado solo pueda consultar e insertar sus propias partidas. El identificador del usuario se obtiene mediante `auth.uid()`.

La aplicación utiliza la clave pública de Supabase. No incluyo contraseñas, claves privadas ni la clave `service_role` en el frontend ni en el repositorio.

## Comprobar la compilación

Para comprobar que el proyecto compila correctamente, ejecuto:

```bash
npm run build
```

## Publicación

He publicado el proyecto utilizando GitHub y Vercel.

1. Subo el proyecto a GitHub.
2. Importo el repositorio desde Vercel.
3. Configuro las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel.
4. Despliego la aplicación.
5. Añado el dominio público a las Redirect URLs de Supabase.
6. Compruebo el inicio de sesión con Google desde la aplicación publicada.

## Pruebas antes de entregar

- Inicio sesión con Google.
- Recargo la página y compruebo que la sesión continúa.
- Juego y termino una partida.
- Compruebo que la partida se guarda en PostgreSQL y aparece en el historial.
- Cierro sesión y vuelvo a entrar.
- Pruebo con una segunda cuenta de Google y compruebo que no puede consultar las partidas de la primera.
- Compruebo el funcionamiento y el diseño en ordenador y móvil.

## Entrega

- **Repositorio GitHub:** https://github.com/Xaviii4zk/caja-fuerte-digital
- **Aplicación desplegada:** https://caja-fuerte-digital-qgcdglqxo-xavis-projects-da6f851a.vercel.app/