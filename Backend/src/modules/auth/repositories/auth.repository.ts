export type Role = 'CANDIDATE' | 'RECRUITER';
export type Kind = 'COMPANY' | 'INDIVIDUAL';
export interface User {
  id: string; name: string; email: string; phone: string | null; dni: string | null; role: Role;
  account_state: string; email_verified: boolean; kind: Kind | null; phone_verified: boolean;
  password_hash: string;
}
export type NewUser = Pick<User, 'name' | 'email' | 'phone' | 'role' | 'kind' | 'password_hash'>;
export type Profile = Pick<User, 'name' | 'email' | 'phone' | 'dni'>;
export interface Session { user: User; expires_at: Date }
export interface AuthRepository {
  findByEmail(email: string): Promise<User | null>;
  createUser(user: NewUser): Promise<User>;
  createSession(hash: string, userId: string, expiresAt: Date): Promise<void>;
  findSession(hash: string, now: Date): Promise<Session | null>;
  touchSession(hash: string, now: Date, expiresAt: Date): Promise<boolean>;
  deleteSession(hash: string): Promise<void>;
  updateProfile(userId: string, profile: Profile): Promise<User>;
}
