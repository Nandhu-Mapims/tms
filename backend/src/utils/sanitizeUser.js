const sanitizeUser = (user) => ({
  id: user._id?.toString?.() ?? user.id,
  fullName: user.fullName,
  empId: user.empId,
  email: user.email,
  phone: user.phone,
  role: user.role,
  departmentId: user.departmentId,
  departmentIds: Array.isArray(user.departmentIds) ? user.departmentIds : [],
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

module.exports = sanitizeUser;
