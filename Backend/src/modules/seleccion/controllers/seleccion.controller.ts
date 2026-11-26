import { asyncHandler } from '../../../shared/errors.js';
import type { SeleccionService } from '../services/seleccion.service.js';
export class SeleccionController {
  constructor(private service:SeleccionService){}
  jobs=asyncHandler(async(_req,res)=>{res.json(await this.service.jobs(res.locals.session.user));});
  list=asyncHandler(async(req,res)=>{res.json(await this.service.list(res.locals.session.user,req.params.jobId,req.query));});
  detail=asyncHandler(async(req,res)=>{res.json(await this.service.detail(res.locals.session.user,req.params.applicationId));});
  decide=asyncHandler(async(req,res)=>{res.json(await this.service.decide(res.locals.session.user,req.params.applicationId,req.body));});
}
