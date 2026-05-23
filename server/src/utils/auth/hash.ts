import { hash, verify } from 'argon2';

export const hashing = async (password: string) => {
  const hashedPass = await hash(password);
  return hashedPass;
};

export const verifyHash = async (hashedPassword: string, password: string) => {
  try {
    const isValid = await verify(hashedPassword, password);
    return isValid;
  } catch (err) {
    // Return false on error to simplify callers expecting a boolean
    return false;
  }
};
