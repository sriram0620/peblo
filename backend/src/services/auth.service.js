import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import env from '../config/env.js';

const SALT_ROUNDS = 12;

/**
 * Register a new user
 */
export async function signup({ name, email, password }) {
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw { status: 409, message: 'An account with this email already exists' };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  // Generate JWT
  const token = generateToken(user);

  return { user, token };
}

/**
 * Authenticate user and return JWT
 */
export async function login({ email, password }) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw { status: 401, message: 'Invalid email or password' };
  }

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };

  // Generate JWT
  const token = generateToken(userData);

  return { user: userData, token };
}

/**
 * Get current user profile
 */
export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw { status: 404, message: 'User not found' };
  }

  return user;
}

/**
 * Generate JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}
