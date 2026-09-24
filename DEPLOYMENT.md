# Visual360 — Producción

Visual360 está preparado para desplegarse con:

- Next.js 16
- PostgreSQL / Neon
- Prisma
- NextAuth
- Vercel Blob
- Vercel

## Variables requeridas

Configura estas variables en Vercel para Preview y Production:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=...
BLOB_READ_WRITE_TOKEN=...
NEXT_PUBLIC_APP_NAME=Visual360
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
MAX_FILE_SIZE=104857600
```

### NEXTAUTH_SECRET

Genera un secreto nuevo. No reutilices el que estuvo versionado anteriormente.

Por ejemplo:

```bash
openssl rand -base64 48
```

## Base de datos

El proyecto ya incluye una migración PostgreSQL inicial.

En un entorno con `DATABASE_URL` configurado:

```bash
npm install
npm run db:migrate:deploy
```

Luego:

```bash
npm run build
```

## Vercel Blob

Crea o conecta un Blob Store al proyecto de Vercel y expón su token como:

```env
BLOB_READ_WRITE_TOKEN=...
```

Los uploads aceptan JPEG, PNG, WebP, AVIF y MP4. El límite por defecto es 100 MB y puede ajustarse con `MAX_FILE_SIZE`.

## Seguridad

- Las rutas de proyectos requieren sesión.
- Lectura, edición y borrado validan propiedad por `userId`.
- Los uploads validan sesión y propiedad del proyecto.
- Los tours públicos solo se exponen cuando `isPublic = true`.
- El endpoint público devuelve una representación saneada que no incluye `userId`.
- Nunca vuelvas a versionar archivos `.env`.

## Flujo de publicación

1. El usuario crea o abre un proyecto.
2. Los proyectos se guardan en PostgreSQL mediante `/api/projects`.
3. Planos, logos y panoramas se guardan en Vercel Blob.
4. El editor persiste en base de datos solo las URLs de los assets.
5. Al compartir un proyecto, se activa `isPublic`, se guarda `shareSlug` y se publica en `/tour/[slug]`.

## Verificación antes de merge

Ejecuta:

```bash
npm install
npm run lint
npm run build
```

Después prueba como mínimo:

- registro
- login
- crear proyecto
- subir plano
- crear punto
- subir panorama
- guardar
- cerrar sesión / volver a iniciar
- abrir el proyecto desde otro navegador
- publicar
- abrir el enlace público
- eliminar proyecto

## Nota sobre datos antiguos

La versión anterior almacenaba proyectos en IndexedDB y assets como base64 en el navegador. Esos proyectos locales no se migran automáticamente a PostgreSQL.

Si existen proyectos locales que deban conservarse, exporta sus datos antes de reemplazar la versión anterior en producción.
