1. Requisitos Previos

    Node.js: Instalado (versión 18 o superior).

    MySQL: Un servidor corriendo (XAMPP, WAMP o una instalación local de MySQL).

    API Key de Gemini: Debes tener tu llave de Google AI Studio.

2. Configuración de la Base de Datos (MySQL)

    Abre tu gestor de base de datos (phpMyAdmin, MySQL Workbench o terminal).

    Crea la base de datos ejecutando el contenido del archivo schema.sql que te proporcioné.

        Esto creará las tablas de productos, pedidos, eventos y el usuario administrador inicial (PIN: 1234).

3. Configuración del Backend (Node.js)

El backend está en server.js. Para ejecutarlo:

    Inicializa el proyecto:
    code Bash

    npm init -y

    Instala las dependencias:
    code Bash

    npm install express cors mysql2 swagger-ui-express swagger-jsdoc

    Configura las variables de entorno:
    Crea un archivo .env en la raíz (o asegúrate de que el sistema las reconozca) con estos datos:
    code Env

    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=tu_password_aqui
    DB_NAME=bachestic_db_sponsors
    PORT=3001
    API_KEY=tu_api_key_de_gemini

    Corre el servidor:
    code Bash

    node server.js

        Verás un mensaje: Server running on http://localhost:3001.

        Puedes ver la documentación de la API en http://localhost:3001/api-docs.

4. Configuración del Frontend (React + Vite)

Como los archivos son .tsx, el navegador no puede leerlos directamente; necesitan ser "transpilados". La forma más rápida y moderna es usar Vite.

    Crea una estructura de proyecto:
    Te recomiendo mover los archivos a una carpeta llamada src (excepto index.html).

    Instala las dependencias del frontend:
    code Bash

    npm install react react-dom lucide-react @google/genai

    Ejecuta en modo desarrollo:
    Si usas Vite:
    code Bash

    npm run dev

Notas de Arquitectura (Importante)

    Conexión Frontend-Backend: El archivo services/api.ts ya está configurado para apuntar a http://localhost:3001/api. Asegúrate de que el backend esté corriendo antes de intentar usar la tienda o el panel de administración.

    IA (Gemini): El aiservice.ts usará la API_KEY que definas en tu entorno. Esto permitirá que el administrador genere descripciones automáticas para los productos.

    Panel de Administración:

        Haz clic en el icono de usuario o ve a la sección de Admin.

        Usa el PIN: 1234 (definido en schema.sql).

        Desde ahí puedes cargar fotos reales a la galería o inventario.

Resumen de URLs una vez corriendo:

    Web App: http://localhost:5173 (o el puerto que te asigne Vite).

    Documentación API (Swagger): http://localhost:3001/api-docs.

    Base de Datos: localhost:3306 (por defecto).