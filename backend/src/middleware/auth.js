import supabase from '../config/supabase.js';

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }
  return null;
}

export async function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token Bearer obrigatório' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) {
      return res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
    }

    req.auth = {
      user: data.user,
      token,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Falha ao autenticar token' });
  }
}
