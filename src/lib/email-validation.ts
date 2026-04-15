// Common typos in email domains
const DOMAIN_TYPOS: Record<string, string> = {
  "gmail.con": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.com.br": "gmail.com",
  "gmal.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "hotmail.con": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.cm": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "outlook.con": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.cm": "outlook.com",
  "outllook.com": "outlook.com",
  "yahoo.con": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.cm": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "icloud.con": "icloud.com",
  "icloud.co": "icloud.com",
  "live.con": "live.com",
  "live.co": "live.com",
  "uol.com.bt": "uol.com.br",
  "uol.con.br": "uol.com.br",
  "terra.com.bt": "terra.com.br",
  "terra.con.br": "terra.com.br",
  "bol.com.bt": "bol.com.br",
  "bol.con.br": "bol.com.br",
  "ig.com.bt": "ig.com.br",
  "ig.con.br": "ig.com.br",
};

// Valid TLDs (most common)
const VALID_TLDS = new Set([
  "com", "com.br", "net", "org", "edu", "gov", "io", "co", "me",
  "info", "biz", "app", "dev", "tech", "online", "store", "site",
  "br", "us", "uk", "eu", "de", "fr", "es", "it", "pt", "ar",
  "mx", "cl", "co.uk", "org.br", "net.br", "edu.br", "gov.br",
  "adv.br", "eng.br", "med.br", "jus.br",
]);

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string; // e.g. "Você quis dizer gmail.com?"
}

export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  // Basic format check
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!basicRegex.test(trimmed)) {
    return { valid: false, error: "Digite um e-mail válido (ex: nome@email.com)" };
  }

  const [, domain] = trimmed.split("@");
  if (!domain) {
    return { valid: false, error: "Digite um e-mail válido (ex: nome@email.com)" };
  }

  // Check for known typos
  if (DOMAIN_TYPOS[domain]) {
    const corrected = trimmed.replace(domain, DOMAIN_TYPOS[domain]);
    return {
      valid: false,
      error: `Parece que há um erro no e-mail. Você quis dizer ${corrected}?`,
      suggestion: corrected,
    };
  }

  // Check TLD validity
  const parts = domain.split(".");
  if (parts.length < 2) {
    return { valid: false, error: "Digite um e-mail válido (ex: nome@email.com)" };
  }

  // Build possible TLDs (e.g. "com.br" or just "com")
  const lastTwo = parts.slice(-2).join(".");
  const lastOne = parts[parts.length - 1];

  if (!VALID_TLDS.has(lastTwo) && !VALID_TLDS.has(lastOne)) {
    // Check if it's a typo of a common TLD
    if (lastOne === "con" || lastOne === "cm" || lastOne === "om") {
      return {
        valid: false,
        error: `O domínio "${domain}" parece incorreto. Verifique se digitou corretamente.`,
      };
    }
    // Still allow unknown TLDs for corporate emails, but warn about suspicious ones
    if (lastOne.length < 2) {
      return { valid: false, error: "Digite um e-mail válido (ex: nome@email.com)" };
    }
  }

  return { valid: true };
}
