import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/errors.js';
import type { AuthService } from '../services/auth.service.js';
const cookieName = 'qt_session';
export function sessionToken(req: Request) {
  const values = (req.headers.cookie ?? '').split(';').map(value => value.trim()).filter(value => value.startsWith(`${cookieName}=`));
  return values.length === 1 ? values[0]!.slice(cookieName.length + 1) : undefined;
}
export class AuthController {
  constructor(private service: AuthService, private secure: boolean) {}
  private clear(res: Response) { res.clearCookie(cookieName, {httpOnly: true, secure: this.secure, sameSite: 'strict', path: '/api'}); }
  registerCandidate = asyncHandler(async (req,res) => { res.status(201).json(await this.service.register('CANDIDATE',req.body)); });
  registerRecruiter = asyncHandler(async (req,res) => { res.status(201).json(await this.service.register('RECRUITER',req.body)); });
  login = asyncHandler(async (req,res) => {
    const { token, ...session } = await this.service.login(req.body);
    await this.service.logout(sessionToken(req));
    res.cookie(cookieName,token,{httpOnly:true,secure:this.secure,sameSite:'strict',path:'/api'});
    res.json(session);
  });
  logout = asyncHandler(async (req,res) => { await this.service.logout(sessionToken(req)); this.clear(res); res.status(204).end(); });
  me = asyncHandler(async (req,res) => { res.json(await this.service.authenticate(sessionToken(req))); });
  refresh = asyncHandler(async (req,res) => { res.json(await this.service.refresh(sessionToken(req))); });
  update = asyncHandler(async (req,res) => {
    const result = await this.service.update(sessionToken(req),req.body);
    if (result.verification_required) this.clear(res);
    res.json(result);
  });
}
