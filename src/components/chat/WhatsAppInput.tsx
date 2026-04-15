import { useState, useRef, useEffect } from "react";
import { ArrowUp, ChevronDown } from "lucide-react";

const COUNTRIES = [
  { code: "BR", ddi: "55", flag: "🇧🇷", name: "Brasil", maxDigits: 11 },
  { code: "PT", ddi: "351", flag: "🇵🇹", name: "Portugal", maxDigits: 9 },
  { code: "US", ddi: "1", flag: "🇺🇸", name: "EUA", maxDigits: 10 },
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

interface WhatsAppInputProps {
  onSubmit: (value: string) => void;
}

const WhatsAppInput = ({ onSubmit }: WhatsAppInputProps) => {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [value, setValue] = useState("");
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

  const stripDuplicateDDI = (digits: string, ddi: string): string => {
    if (digits.length > country.maxDigits && digits.startsWith(ddi)) {
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
  };

  const formatBR = (digits: string) => {
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleChange = (raw: string) => {
    let digits = raw.replace(/\D/g, "");
    digits = stripDuplicateDDI(digits, country.ddi);
    digits = digits.slice(0, country.maxDigits);
    setValue(country.code === "BR" ? formatBR(digits) : digits);
  };

  const handleSubmit = () => {
    let digits = value.replace(/\D/g, "");
    digits = stripDuplicateDDI(digits, country.ddi);
    if (digits.length > 0) {
      onSubmit(`+${country.ddi}${digits}`);
      setValue("");
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.target;
    el.setAttribute("readonly", "readonly");
    setTimeout(() => {
      el.removeAttribute("readonly");
      const current = el.value.replace(/\D/g, "");
      if (current.length > 0) {
        const cleaned = stripDuplicateDDI(current, country.ddi).slice(0, country.maxDigits);
        setValue(country.code === "BR" ? formatBR(cleaned) : cleaned);
      }
    }, 100);
  };

  return (
    <div className="animate-fade-in-up">
      <input type="tel" name="phone" autoComplete="tel" style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }} tabIndex={-1} aria-hidden="true" />
      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 bg-[#F5F5F5] rounded-full px-3 py-3 border border-gray-200 shrink-0 hover:border-[#D4A017]/40 transition-colors"
          >
            <span className="text-base">{country.flag}</span>
            <span className="text-xs text-gray-500">+{country.ddi}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {open && (
            <div className="absolute bottom-full left-0 mb-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto w-52 animate-fade-in">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { setCountry(c); setValue(""); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors text-sm ${
                    c.code === country.code ? "bg-gray-50 font-medium" : ""
                  }`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="text-[#1a1a1a] flex-1 truncate text-xs">{c.name}</span>
                  <span className="text-gray-400 text-xs">+{c.ddi}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-2 bg-[#F5F5F5] rounded-full px-3 py-3 border border-gray-200 focus-within:border-[#D4A017] transition-colors">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            onFocus={handleFocus}
            placeholder={country.code === "BR" ? "(11) 99999-9999" : "Número"}
            className="flex-1 min-w-0 bg-transparent outline-none text-[#1a1a1a] placeholder:text-gray-400 text-base"
            autoFocus
            autoComplete="new-password"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            data-lpignore="true"
            data-form-type="other"
            name={`wpp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`}
            id={`wpp_${Date.now()}`}
            data-gtm="phone"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-11 h-11 rounded-full bg-[#D4A017] text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:bg-gray-200 disabled:text-gray-400 active:scale-95"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default WhatsAppInput;
