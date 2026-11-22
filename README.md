# Caja fuerte digital - Adivina el número

Videojuego web individual desarrollado con HTML5, CSS3, JavaScript Vanilla, Vite, Supabase Auth y PostgreSQL.

## Reglas del juego

1. Inicia sesión con Google.
2. Pulsa **Nueva partida**.
3. Adivina el número secreto entre 1 y 100.
4. El juego te indica si el número secreto es mayor o menor.
5. Cuando aciertas, la partida termina y se calcula tu puntuación.
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

- Node.js instalado.
- Una cuenta de Supabase.
- Un proyecto de Google Cloud para configurar OAuth.
- Una cuenta de GitHub.

## Instalación local

1. Clona el repositorio o descarga el proyecto.
2. Abre una terminal en la carpeta del proyecto.
3. Instala las dependencias:

   ```bash
   npm install
   ```

4. Copia el archivo `.env.example` y crea un archivo llamado `.env`.
5. Completa las variables de entorno con los datos de tu proyecto de Supabase:

   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
   ```

6. En Supabase, abre **SQL Editor**, crea una consulta nueva, copia el contenido de `supabase.sql` y ejecútalo.
7. Inicia el servidor de desarrollo:

   ```bash
   npm run dev
   ```

8. Abre la dirección local que muestra Vite en el navegador.

## Configuración de Google OAuth

1. En Google Cloud Console, crea o selecciona un proyecto.
2. Configura la pantalla de consentimiento OAuth.
3. Crea un cliente OAuth de tipo **Aplicación web**.
4. En los URI de redireccionamiento autorizados de Google, añade la URL de callback que muestra Supabase en **Authentication > Providers > Google**. Normalmente tiene este formato:

   ```text
   https://TU-PROYECTO.supabase.co/auth/v1/callback
   ```

5. Copia el Client ID y el Client Secret de Google en el proveedor Google de Supabase y actívalo.
6. En Supabase, entra en **Authentication > URL Configuration**.
7. Configura la Site URL y las Redirect URLs permitidas para el entorno local y la aplicación desplegada.

## Base de datos y seguridad

La tabla `public.partidas` almacena las partidas finalizadas, incluyendo el identificador del usuario, la fecha, el resultado, la puntuación, la duración y los intentos.

El archivo `supabase.sql` contiene las instrucciones para crear la tabla y configurar la seguridad.

Se utiliza Row Level Security (RLS) para que cada usuario autenticado solo pueda consultar e insertar sus propias partidas. El identificador del usuario se obtiene mediante `auth.uid()`.

La aplicación utiliza la clave pública de Supabase. No se deben incluir contraseñas, claves privadas ni la clave `service_role` en el frontend o en el repositorio.

## Comprobar la compilación

Para comprobar que el proyecto compila correctamente:

```bash
npm run build
```

## Publicación

El proyecto se puede publicar utilizando GitHub y Vercel.

1. Sube el proyecto a GitHub.
2. Importa el repositorio desde Vercel.
3. Configura las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en Vercel.
4. Despliega la aplicación.
5. Añade el dominio público a las Redirect URLs de Supabase.
6. Comprueba el inicio de sesión con Google desde la aplicación publicada.

## Pruebas antes de entregar

- Iniciar sesión con Google.
- Recargar la página y comprobar que la sesión continúa.
- Jugar y terminar una partida.
- Comprobar que la partida se guarda en PostgreSQL y aparece en el historial.
- Cerrar sesión y volver a entrar.
- Probar con una segunda cuenta de Google y comprobar que no puede consultar las partidas de la primera.
- Comprobar el funcionamiento y el diseño en ordenador y móvil.

## Entrega

- **Repositorio GitHub:** (añadir URL)
- **Aplicación desplegada:** (añadir URL)
