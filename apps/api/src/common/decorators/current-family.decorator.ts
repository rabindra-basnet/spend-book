import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../types/authenticated-user.js';

/**
 * Injects the authenticated user's active family ID out of the request context.
 * Guarantees that multi-tenant controllers receive a non-null family ID.
 */
export const CurrentFamily = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const familyId = request.user?.familyId;
    if (!familyId) {
      throw new UnauthorizedException(
        'Active family tenancy context is missing',
      );
    }
    return familyId;
  },
);
