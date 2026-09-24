# Security

## Environment variables

Never commit `.env` files or production credentials. Use `.env.example` for variable names only and configure real values in the deployment provider.

The repository previously contained a tracked `.env` file. Any credential that has ever been committed should be considered exposed and rotated before production use.

## Application access

Private project APIs, editor routes and file uploads should require an authenticated user and must verify project ownership server-side. Public tour routes should only expose projects explicitly marked as public.

## Storage

Do not rely on local filesystem persistence in serverless deployments. Store panoramas, thumbnails, logos and media in durable object storage and persist only their URLs/metadata in the database.

## Reporting

If you discover a vulnerability, do not publish credentials or exploit details in a public issue. Rotate affected secrets first, then document the remediation.
