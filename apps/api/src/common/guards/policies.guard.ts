import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { POLICIES_KEY, type PolicyEvaluator } from '../decorators/policies.decorator.js';
import type { AuthenticatedUser } from '../types/authenticated-user.js';

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

/** Enforces `@Policies(...)` metadata; routes without it are always allowed. */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const evaluators = this.reflector.getAllAndOverride<PolicyEvaluator[]>(POLICIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!evaluators || evaluators.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      return false;
    }
    for (const evaluator of evaluators) {
      const allowed = await evaluator(user, request);
      if (!allowed) {
        return false;
      }
    }
    return true;
  }
}