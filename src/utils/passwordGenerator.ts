/**
 * Genera una contraseña aleatoria segura
 * @param length Longitud de la contraseña (por defecto 12)
 * @returns Contraseña aleatoria
 */
export function generateRandomPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';

  const allCharacters = uppercase + lowercase + numbers + symbols;

  let password = '';

  // Asegurar que la contraseña tenga al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Completar el resto de la contraseña con caracteres aleatorios
  for (let i = password.length; i < length; i++) {
    password += allCharacters[Math.floor(Math.random() * allCharacters.length)];
  }

  // Mezclar los caracteres para que no estén en orden predecible
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
