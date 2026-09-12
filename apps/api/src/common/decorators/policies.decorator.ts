import { SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/authenticated-user.js';

export const POLICIES_KEY = 'auth:policies';

/** A predicate that decides access for a route given the principal and the request. */
export type PolicyEvaluator = (
  user: AuthenticatedUser,
  request: Request,
) => boolean | Promise<boolean>;

/** Allows a route only when every evaluator returns `true`. */
export const Policies = (...evaluators: PolicyEvaluator[]) =>
  SetMetadata(POLICIES_KEY, evaluators);