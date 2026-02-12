/**
 * Utilitários para validação de força de senha
 */

export interface PasswordStrength {
  score: number; // 0 a 4
  label: 'Muito Fraca' | 'Fraca' | 'Média' | 'Forte' | 'Muito Forte';
  color: string;
  requirements: {
    length: boolean;
    upper: boolean;
    lower: boolean;
    number: boolean;
    special: boolean;
  };
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  
  let score = 0;
  if (password.length > 0) {
    if (password.length < 6) score = 0;
    else if (metRequirements <= 2) score = 1;
    else if (metRequirements === 3) score = 2;
    else if (metRequirements === 4) score = 3;
    else score = 4;
  }

  const map: Record<number, { label: PasswordStrength['label'], color: string }> = {
    0: { label: 'Muito Fraca', color: 'bg-red-500' },
    1: { label: 'Fraca', color: 'bg-orange-500' },
    2: { label: 'Média', color: 'bg-yellow-500' },
    3: { label: 'Forte', color: 'bg-emerald-500' },
    4: { label: 'Muito Forte', color: 'bg-indigo-600' },
  };

  return {
    score,
    ...map[score],
    requirements,
  };
}

export const MIN_STRONG_PASSWORD_SCORE = 3; // Exigir pelo menos "Forte"
