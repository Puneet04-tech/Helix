/**
 * Centralised environment bootstrap.
 *
 * This module MUST be imported (for its side effects) before any other module
 * that reads process.env.JWT_SECRET — i.e. before JwtModule.register() in
 * app.module.ts / auth.module.ts and before the JwtStrategy constructor.
 *
 * Why this exists:
 *   JwtModule.register() captures the secret at module-load time, while the
 *   JwtStrategy reads it later at DI-construction time. If the secret is only
 *   defaulted inside bootstrap() (main.ts), the two can capture different
 *   values when JWT_SECRET is unset, so tokens are signed with one secret and
 *   verified with another -> every guarded route returns 401. Loading .env and
 *   fixing the default here, then importing this file first, guarantees a
 *   single consistent secret across signing and verification.
 */
import { config } from 'dotenv';

// Load variables from .env into process.env.
config();

// Guarantee a JWT secret is present and identical everywhere, before anything
// captures it.
if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET === 'your-secret-key-change-in-production'
) {
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
    // eslint-disable-next-line no-console
    console.warn(
      '[load-env] JWT_SECRET not set, generated a random secret for production. ' +
        'Set JWT_SECRET explicitly to keep tokens valid across restarts/instances.',
    );
  } else {
    process.env.JWT_SECRET = 'dev-secret-key-change-in-production';
    // eslint-disable-next-line no-console
    console.warn('[load-env] JWT_SECRET not set, using development default.');
  }
}
