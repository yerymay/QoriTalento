import { asyncHandler } from '../../../shared/errors.js';
import type { SeguimientoService } from '../services/seguimiento.service.js';
export class SeguimientoController {
  constructor(private service:SeguimientoService){}
  list=asyncHandler(async(req,res)=>{res.json(await this.service.list(res.locals.session.user,req.query));});
  read=asyncHandler(async(req,res)=>{res.json(await this.service.read(res.locals.session.user,req.params.applicationId));});
}
