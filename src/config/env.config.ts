import { z } from 'zod';

export const envSchema = z.object({
  SECRET_ACCESS_TOKEN: z.string().min(1, 'SECRET_ACCESS_TOKEN is required'),
  DATABASE_URL: z.url().min(1, 'DATABASE_URL must be a valid URL'),
  PORT: z.coerce.number().default(3000),
});

export type EnvSchema = z.infer<typeof envSchema>;
