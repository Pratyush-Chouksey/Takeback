const adminMiddleware = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];

  if (adminKey !== 'takeback-admin-2024') {
    return res.status(403).json({ success: false, message: 'Unauthorized: invalid admin key' });
  }

  next();
};

module.exports = adminMiddleware;
