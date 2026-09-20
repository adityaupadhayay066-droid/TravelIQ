const { z } = require('zod');

// ─── Zod Schemas (.passthrough() ensures extra fields like turnstileToken or device_id aren't stripped) ───

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long").trim(),
  email: z.string().email("Invalid email format").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long"),
  phone: z.string().optional()
}).passthrough();

const loginSchema = z.object({
  email: z.string().email("Invalid email format").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
  device_id: z.string().optional()
}).passthrough();

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email format").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
}).passthrough();

const adminRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long").trim(),
  email: z.string().email("Invalid email format").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long"),
  adminSecret: z.string().min(1, "Admin security key is required")
}).passthrough();

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(128)
}).passthrough();

// ─── Middleware Factory ───
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Parse and sanitize the body
      const parsedData = schema.parse(req.body);
      req.body = parsedData; // Replace body with sanitized data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        return res.status(400).json({ 
          message: 'Invalid request data', 
          errors 
        });
      }
      next(error);
    }
  };
};

module.exports = {
  validateRequest,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    adminLogin: adminLoginSchema,
    adminRegister: adminRegisterSchema,
    passwordUpdate: passwordUpdateSchema
  }
};
