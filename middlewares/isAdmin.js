const isAdmin = (req, res, next) => {
  console.log("Checking admin role:", req.user);
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next(); // User is admin, proceed
};

module.exports = isAdmin;
