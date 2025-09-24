import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch {
    throw new Error("Error hashing password");
  }
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    throw new Error("Error comparing password");
  }
};

export const generateRandomPassword = (length: number = 12): string => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password;
};
