import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { PoliciesGuard } from '../../common/guards/policies.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Policies } from '../../common/decorators/policies.decorator.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';

const user: AuthenticatedUser = {
  id: 'user-1',
  email: 'ada@example.com',
  role: 'admin',
  familyId: 'family-1',
};

interface ExecutionContextView {
  getHandler(): unknown;
  getClass(): unknown;
  switchToHttp(): { getRequest(): unknown };
}

const contextFor = (
  handler: unknown,
  clazz: unknown,
): ExecutionContextView => ({
  getHandler: () => handler,
  getClass: () => clazz,
  switchToHttp: () => ({ getRequest: () => ({ user }) }),
});

describe('AuthGuard', () => {
  const guard = new AuthGuard(new Reflector());

  it('bypasses authentication for @Public() routes', () => {
    @Public()
    class PublicController {
      value(): void {}
    }
    expect(
      guard.canActivate(
        contextFor(PublicController.prototype.value, PublicController) as never,
      ),
    ).toBe(true);
  });
});

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows any route without role metadata', () => {
    class NoRoles {
      value(): void {}
    }
    expect(
      guard.canActivate(contextFor(NoRoles.prototype.value, NoRoles) as never),
    ).toBe(true);
  });

  it('allows matching roles', () => {
    @Roles('admin', 'super_admin')
    class AdminOnly {
      value(): void {}
    }
    expect(
      guard.canActivate(
        contextFor(AdminOnly.prototype.value, AdminOnly) as never,
      ),
    ).toBe(true);
  });

  it('denies a mismatched role', () => {
    @Roles('super_admin')
    class SuperAdminOnly {
      value(): void {}
    }
    expect(
      guard.canActivate(
        contextFor(SuperAdminOnly.prototype.value, SuperAdminOnly) as never,
      ),
    ).toBe(false);
  });
});

describe('PoliciesGuard', () => {
  const guard = new PoliciesGuard(new Reflector());

  it('allows when every evaluator passes', async () => {
    @Policies(
      (principal: AuthenticatedUser) => principal.familyId === 'family-1',
    )
    class FamilyScoped {
      value(): void {}
    }
    expect(
      await guard.canActivate(
        contextFor(FamilyScoped.prototype.value, FamilyScoped) as never,
      ),
    ).toBe(true);
  });

  it('denies when an evaluator fails', async () => {
    @Policies(
      () => true,
      (principal: AuthenticatedUser) => principal.role === 'super_admin',
    )
    class SuperAdminOnly {
      value(): void {}
    }
    expect(
      await guard.canActivate(
        contextFor(SuperAdminOnly.prototype.value, SuperAdminOnly) as never,
      ),
    ).toBe(false);
  });
});
