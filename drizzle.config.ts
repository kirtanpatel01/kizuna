import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle', // Directory for migration files
  schema: './src/lib/schema.ts', // Path to your schema definition
  dialect: 'postgresql', // Database engine (postgresql, mysql, or sqlite)
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Your database connection string
  },
});
