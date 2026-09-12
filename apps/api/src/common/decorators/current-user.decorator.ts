import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/authenticated-user.js';

/**
 * Injects the authenticated principal set by the global auth guard.
 * `@CurrentUser()` returns the whole principal, `@CurrentUser('role')` a field.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);