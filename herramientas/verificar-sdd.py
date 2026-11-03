#!/usr/bin/env python3
"""Validación documental sin dependencias externas. No implementa el ATS."""
from pathlib import Path
import re,sys
root=Path(__file__).resolve().parent.parent
modules=['01-gestion-usuarios','02-ofertas','03-postulaciones','04-extraccion-cv','05-examenes','06-evaluacion','07-resultados-seleccion','08-seguimiento']
expected=['docs/requirements/sources/requerimientos-sistema-original.pdf','docs/requirements/sources/requisitos-ui-original.txt','docs/decisions/decisiones-aprobadas.md','docs/decisions/00-acta-decisiones-pendientes.md','docs/constitution-borrador.md','docs/architecture/01-arquitectura-sistema.md','docs/implementation/fase5-backlog-transversal.md','docs/implementation/fase5-validacion-integral.md','contratos/openapi-3.1-draft.yaml','diagramas/modelo-er.mmd']
expected += [f'specs/{m}/{fn}' for m in modules for fn in ('spec.md','plan.md','tasks.md')]
expected += ['specs/06-evaluacion/addendum-ia-v04.md']
missing=[p for p in expected if not (root/p).is_file()]
ids=[]
files=['docs/implementation/fase5-backlog-transversal.md','docs/implementation/fase5-validacion-integral.md']+[f'specs/{m}/tasks.md' for m in modules]
for rel in files:
    p=root/rel
    if p.is_file():
        ids += re.findall(r'^- \[ \] \*\*((?:M\d\d|V\d\d)-\d\d)',p.read_text(encoding='utf-8'),re.M)
from collections import Counter
dup=[i for i,n in Counter(ids).items() if n>1]
print('Qori Talento | Documentación SDD')
print('Archivos esenciales:',len(expected),'faltan:',len(missing))
print('Tareas detectadas:',len(ids),'IDs repetidos:',len(dup))
for p in missing: print('FALTA:',p)
for i in dup: print('DUPLICADA:',i)
if len(ids)!=120: print('AVISO: El backlog esperado contenía 120 tareas.')
if missing or dup or len(ids)!=120:
    sys.exit(1)
print('OK: estructura y 120 identificadores presentes; esto NO certifica aplicación ni requisitos aprobados.')
