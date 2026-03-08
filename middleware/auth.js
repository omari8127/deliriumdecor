const ADMIN_COOKIE = 'delirium_admin_auth';

function requireAdmin(req, res, next) {
  const token = req.cookies[ADMIN_COOKIE];
  const expected = process.env.ADMIN_PASSWORD || 'admin123';

  if (token && token === expected) {
    return next();
  }

  return res.redirect('/admin/login');
}

module.exports = {
  requireAdmin,
  ADMIN_COOKIE
};
