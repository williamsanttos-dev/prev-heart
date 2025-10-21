import path from 'node:path';
import { z } from 'zod';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(__dirname, '../../.env') });

const schema = z.object({
  SECRET_ACCESS_TOKEN: z.string().nonempty(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    'Invalid environment variables:',
    JSON.stringify(parsed.error.format(), null, 4),
  );
  process.exit(1);
}

export default parsed.data;
