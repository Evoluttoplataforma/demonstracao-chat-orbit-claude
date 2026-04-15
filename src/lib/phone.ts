/**
 * Normaliza telefone brasileiro para o formato +55XXXXXXXXXXX
 * Aceita qualquer formato de entrada: (11) 99999-9999, 11999999999, +5511999999999, etc.
 * 
 * Números brasileiros válidos têm 10 ou 11 dígitos (DDD + número).
 * Se o input tiver mais de 11 dígitos e começar com "55", remove o código de país.
 */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  // Números brasileiros válidos (sem código de país) têm 10-11 dígitos.
  // Se temos mais que 11 dígitos e começa com "55", é código de país.
  while (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.substring(2);
  }

  // Limita a 11 dígitos (DDD 2 dígitos + celular 9 dígitos)
  digits = digits.slice(0, 11);

  return `+55${digits}`;
}
