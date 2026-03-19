// HIPAA session configuration
export const SESSION_CONFIG = {
  // Max session age (30 minutes of inactivity)
  maxIdleMinutes: 30,
  // Absolute session timeout (8 hours)
  maxSessionHours: 8,
  // Max failed login attempts before lockout
  maxLoginAttempts: 5,
  // Lockout duration in minutes
  lockoutMinutes: 15,
  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
  },
};

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { minLength, requireUppercase, requireLowercase, requireNumber, requireSpecial } = SESSION_CONFIG.password;

  if (password.length < minLength) errors.push(`Must be at least ${minLength} characters`);
  if (requireUppercase && !/[A-Z]/.test(password)) errors.push("Must contain an uppercase letter");
  if (requireLowercase && !/[a-z]/.test(password)) errors.push("Must contain a lowercase letter");
  if (requireNumber && !/[0-9]/.test(password)) errors.push("Must contain a number");
  if (requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push("Must contain a special character");

  return { valid: errors.length === 0, errors };
}
