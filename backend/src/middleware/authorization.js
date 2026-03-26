import { permissionService } from '../services/permissionService.js';

export async function attachActor(req, _res, next) {
  const authUserId = req.auth?.user?.id || null;
  if (!authUserId) {
    req.actor = null;
    return next();
  }
  const { userDepartamento, permissions } = await permissionService.getByAuthUserId(authUserId);
  req.actor = {
    authUserId,
    userDepartamento: userDepartamento || null,
    permissions: permissions || {},
  };
  return next();
}

export async function requireTiUser(req, res, next) {
  const actorDept = (req.actor?.userDepartamento || '').trim().toUpperCase();
  if (actorDept !== 'TI') {
    return res.status(403).json({ success: false, error: 'Acesso restrito ao departamento TI' });
  }
  return next();
}
