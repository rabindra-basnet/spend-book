/** Principal attached to `request.user` by the global JWT auth guard. */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: string;
  familyId: string;
}
