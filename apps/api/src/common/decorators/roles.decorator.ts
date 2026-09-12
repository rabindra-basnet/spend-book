import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'auth:roles';

/** Restricts a route to the given roles (e.g. `@Roles('admin', 'super_admin')`). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
