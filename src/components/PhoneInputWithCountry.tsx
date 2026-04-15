import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface Country {
  code: string;
  ddi: string;
  flag: string;
  name: string;
  maxDigits: number;
}

const COUNTRIES: Country[] = [
  { code: "BR", ddi: "55", flag: "🇧🇷", name: "Brasil", maxDigits: 11 },
  { code: "PT", ddi: "351", flag: "🇵🇹", name: "Portugal", maxDigits: 9 },
  { code: "US", ddi: "1", flag: "🇺🇸", name: "Estados Unidos", maxDigits: 10 },
  { code: "AR", ddi: "54", flag: "🇦🇷", name: "Argentina", maxDigits: 10 },
  { code: "MX", ddi: "52", flag: "🇲🇽", name: "México", maxDigits: 10 },
  { code: "CO", ddi: "57", flag: "🇨🇴", name: "Colômbia", maxDigits: 10 },
  { code: "CL", ddi: "56", flag: "🇨🇱", name: "Chile", maxDigits: 9 },
  { code: "PE", ddi: "51", flag: "🇵🇪", name: "Peru", maxDigits: 9 },
  { code: "UY", ddi: "598", flag: "🇺🇾", name: "Uruguai", maxDigits: 8 },
  { code: "PY", ddi: "595", flag: "🇵🇾", name: "Paraguai", maxDigits: 9 },
  { code: "EC", ddi: "593", flag: "🇪🇨", name: "Equador", maxDigits: 9 },
  { code: "BO", ddi: "591", flag: "🇧🇴", name: "Bolívia", maxDigits: 8 },
  { code: "VE", ddi: "58", flag: "🇻🇪", name: "Venezuela", maxDigits: 10 },
  { code: "CR", ddi: "506", flag: "🇨🇷", name: "Costa Rica", maxDigits: 8 },
  { code: "PA", ddi: "507", flag: "🇵🇦", name: "Panamá", maxDigits: 8 },
  { code: "DO", ddi: "1", flag: "🇩🇴", name: "Rep. Dominicana", maxDigits: 10 },
  { code: "GT", ddi: "502", flag: "🇬🇹", name: "Guatemala", maxDigits: 8 },
  { code: "ES", ddi: "34", flag: "🇪🇸", name: "Espanha", maxDigits: 9 },
  { code: "DE", ddi: "49", flag: "🇩🇪", name: "Alemanha", maxDigits: 11 },
  { code: "GB", ddi: "44", flag: "🇬🇧", name: "Reino Unido", maxDigits: 10 },
  { code: "FR", ddi: "33", flag: "🇫🇷", name: "França", maxDigits: 9 },
  { code: "IT", ddi: "39", flag: "🇮🇹", name: "Itália", maxDigits: 10 },
];

function stripDuplicateDDI(digits: string, country: Country): string {
  const { ddi, maxDigits } = country;
  if (digits.length > maxDigits && digits.startsWith(ddi)) {
    return digits.slice(ddi.length);
  }
  if (ddi === "55" && digits.length >= 4 && digits.startsWith("55")) {
    const withoutPrefix = digits.slice(2);
    const ddd = parseInt(withoutPrefix.slice(0, 2), 10);
    if (ddd >= 11 && ddd <= 99) {
      return withoutPrefix;
    }
  }
  return digits;
}

function formatBR(digits: string): string {
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatGeneric(digits: string): string {
  return digits;
}

interface PhoneInputWithCountryProps {
  /** Returns the full international number: +{ddi}{digits} */
  onValueChange: (fullNumber: string, rawDigits: string, country: Country) => void;
  value?: string;
  /** Visual style variant */
  variant?: "default" | "card";
  className?: string;
}

export default function PhoneInputWithCountry({
  onValueChange,
  value: _externalValue,
  variant = "default",
  className = "",
}: PhoneInputWithCountryProps) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [digits, setDigits] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDigitsChange = (raw: string) => {
    let d = raw.replace(/\D/g, "");
    d = stripDuplicateDDI(d, country);
    d = d.slice(0, country.maxDigits);
    setDigits(d);
    onValueChange(`+${country.ddi}${d}`, d, country);
  };

  const handleCountryChange = (c: Country) => {
    setCountry(c);
    setDigits("");
    setOpen(false);
    onValueChange(`+${c.ddi}`, "", c);
  };

  const formatted = country.code === "BR" ? formatBR(digits) : formatGeneric(digits);

  const isCard = variant === "card";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Country selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1 shrink-0 transition-colors ${
            isCard
              ? "bg-card rounded-2xl px-3 py-3 border-2 border-border hover:border-primary/40"
              : "bg-secondary rounded-md px-3 py-2 border border-input h-10"
          }`}
        >
          <span className="text-base">{country.flag}</span>
          <span className={`text-sm text-muted-foreground ${isCard ? "" : ""}`}>+{country.ddi}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto w-56 animate-fade-in">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleCountryChange(c)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-accent transition-colors text-sm ${
                  c.code === country.code ? "bg-accent font-medium" : ""
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="text-foreground flex-1 truncate">{c.name}</span>
                <span className="text-muted-foreground text-xs">+{c.ddi}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phone input */}
      <input
        type="tel"
        inputMode="tel"
        value={formatted}
        onChange={(e) => handleDigitsChange(e.target.value)}
        placeholder={country.code === "BR" ? "(11) 99999-9999" : "Número"}
        autoComplete="tel"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-lpignore="true"
        data-form-type="other"
        data-gtm="phone"
        className={`flex-1 min-w-0 bg-transparent outline-none text-current placeholder:text-muted-foreground text-base ${
          isCard
            ? "rounded-2xl bg-card border-2 border-border px-4 py-3 focus:border-primary transition-all"
            : "rounded-md border border-input h-10 px-3 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
        }`}
      />
      {/* Hidden input for GTM to read via [name="phone"] */}
      <input type="hidden" name="phone" value={digits} />
    </div>
  );
}

export { COUNTRIES };
