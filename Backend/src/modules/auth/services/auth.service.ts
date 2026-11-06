import { AppError } from '../../../shared/errors.js';
import type { AuthRepository, Role, User } from '../repositories/auth.repository.js';
import { hashPassword, verifyPassword, tokenHash, newToken } from './password.js';
const publicDomains = new Set(['gmail.com','googlemail.com','hotmail.com','hotmail.es','outlook.com','outlook.es','live.com','yahoo.com','yahoo.es','icloud.com','aol.com','proton.me','protonmail.com','mail.com','msn.com']);
export const publicUser = ({ password_hash: _, ...user }: User) => user;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppError(400, 'INVALID_INPUT', 'Envía un formulario válido.');
  return value as Record<string, unknown>;
}
function allowed(body: Record<string, unknown>, keys: string[]) {
  if (Object.keys(body).some(key => !keys.includes(key))) throw new AppError(400, 'INVALID_INPUT', 'El formulario contiene campos no permitidos.');
}
function text(value: unknown, field: string, min: number, max: number) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new AppError(400, 'INVALID_INPUT', `${field}: ingresa entre ${min} y ${max} caracteres.`);
  return value.trim();
}
function email(value: unknown) {
  const result = text(value, 'Correo', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new AppError(400, 'INVALID_INPUT', 'Ingresa un correo electrónico válido.');
  return result;
}
function phone(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  const result = text(value, 'Teléfono', 7, 32);
  if (!/^\+?[\d ()-]{7,32}$/.test(result)) throw new AppError(400, 'INVALID_INPUT', 'Ingresa un teléfono válido.');
  return result;
}
function corporate(address: string) {
  if (publicDomains.has(address.split('@')[1]!)) throw new AppError(400, 'CORPORATE_EMAIL_REQUIRED', 'Usa el correo corporativo de tu empresa.');
}
export class AuthService {
  constructor(private repo: AuthRepository, private idleMinutes: number, private now = () => new Date()) {}
  async register(role: Role, input: unknown) {
    const body = object(input); allowed(body, role === 'RECRUITER' ? ['name','email','phone','password','kind'] : ['name','email','phone','password']);
    const name = text(body.name, 'Nombre', 2, 160), address = email(body.email), contact = phone(body.phone);
    if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) throw new AppError(400, 'INVALID_INPUT', 'La contraseña debe tener entre 8 y 128 caracteres.');
    const kind = role === 'RECRUITER' ? body.kind : null;
    if (role === 'RECRUITER' && kind !== 'COMPANY' && kind !== 'INDIVIDUAL') throw new AppError(400, 'INVALID_INPUT', 'Selecciona empresa o particular.');
    if (kind === 'COMPANY') corporate(address);
    if (kind === 'INDIVIDUAL' && !contact) throw new AppError(400, 'PHONE_REQUIRED', 'El reclutador particular necesita un teléfono.');
    const user = await this.repo.createUser({name, email: address, phone: contact, role, kind: kind as User['kind'], password_hash: await hashPassword(body.password)});
    return { user: publicUser(user), message: 'Cuenta creada. Ya puedes iniciar sesión.' };
  }
  private active(user: User) {
    if (user.account_state === 'DISABLED') throw new AppError(403, 'ACCOUNT_INACTIVE', 'Tu cuenta está desactivada.');
    if (user.role !== 'CANDIDATE' && user.role !== 'RECRUITER') throw new AppError(403, 'FORBIDDEN', 'Tu cuenta no tiene un rol permitido.');
  }
  async login(input: unknown) {
    const body = object(input); allowed(body, ['email','password']);
    const address = email(body.email);
    const password = typeof body.password === 'string' && body.password.length <= 128 ? body.password : '';
    const user = await this.repo.findByEmail(address);
    // Costo equivalente si el correo no existe; sin revelar existencia mediante el mensaje.
    const hash = user?.password_hash ?? 'scrypt$00000000000000000000000000000000$' + '0'.repeat(128);
    const valid = await verifyPassword(password, hash);
    if (!user || !valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
    this.active(user);
    const token = newToken(), expires = new Date(this.now().getTime() + this.idleMinutes * 60000);
    await this.repo.createSession(tokenHash(token), user.id, expires);
    return { token, user: publicUser(user), expires_at: expires.toISOString() };
  }
  async authenticate(token: string | undefined, role?: Role) {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) throw new AppError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
    const session = await this.repo.findSession(tokenHash(token), this.now());
    if (!session) throw new AppError(401, 'SESSION_EXPIRED', 'Tu sesión terminó. Inicia sesión de nuevo.');
    this.active(session.user);
    if (role && session.user.role !== role) throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para acceder a esta sección.');
    return { user: publicUser(session.user), expires_at: session.expires_at.toISOString() };
  }
  async refresh(token: string | undefined) {
    const session = await this.authenticate(token);
    const expires = new Date(this.now().getTime() + this.idleMinutes * 60000);
    if (!await this.repo.touchSession(tokenHash(token!), this.now(), expires)) throw new AppError(401, 'SESSION_EXPIRED', 'Tu sesión terminó. Inicia sesión de nuevo.');
    return { ...session, expires_at: expires.toISOString() };
  }
  async logout(token?: string) { if (token) await this.repo.deleteSession(tokenHash(token)); }
  async update(token: string | undefined, input: unknown) {
    const {user} = await this.authenticate(token);
    const body = object(input); allowed(body, ['name','email','phone']);
    const profile = {name: text(body.name, 'Nombre', 2, 160), email: email(body.email), phone: phone(body.phone)};
    if (user.kind === 'COMPANY') corporate(profile.email);
    if (user.kind === 'INDIVIDUAL' && !profile.phone) throw new AppError(400, 'PHONE_REQUIRED', 'El teléfono es obligatorio para reclutadores particulares.');
    const updated = await this.repo.updateProfile(user.id, profile);
    return {user: publicUser(updated), verification_required: user.email !== profile.email || (user.kind === 'INDIVIDUAL' && user.phone !== profile.phone)};
  }
}
