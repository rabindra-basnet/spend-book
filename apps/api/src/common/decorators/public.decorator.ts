import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'auth:isPublic';

/** Marks a route (or a whole controller) as reachable without authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);