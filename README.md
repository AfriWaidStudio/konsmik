# Konsmik

Konsmik is a social and community platform focused on the Kons layer, with AI-guided experiences such as Konsai.

## Development

Use Node.js and npm for local development.

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

## Deployment

This project is designed to run as a standard TanStack Start app and can be deployed to Coolify or any Node-compatible platform.

Set the required environment variables in your deployment platform before starting the app:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_API_KEY`
- `AI_API_BASE_URL`

Legacy environment names are still accepted for compatibility:

- `LOVABLE_API_KEY`
- `LOVABLE_API_BASE_URL`
- `OPENAI_API_KEY`
- `OPENAI_API_BASE_URL`
