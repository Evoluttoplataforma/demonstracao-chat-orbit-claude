interface ChatOption {
  label: string;
  emoji?: string;
  color?: string;
}

interface ChatOptionsProps {
  options: (string | ChatOption)[];
  onSelect: (value: string) => void;
}

const colorMap: Record<string, string> = {
  blue: "border-blue-400/60 hover:border-blue-500 hover:bg-blue-50 text-blue-700",
  green: "border-emerald-400/60 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700",
  purple: "border-purple-400/60 hover:border-purple-500 hover:bg-purple-50 text-purple-700",
  gold: "border-[#D4A017]/50 hover:border-[#D4A017] hover:bg-[#D4A017]/10 text-[#8B6914]",
};

const ChatOptions = ({ options, onSelect }: ChatOptionsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in-up">
      {options.map((option) => {
        const isObj = typeof option === "object";
        const label = isObj ? option.label : option;
        const emoji = isObj ? option.emoji : undefined;
        const color = isObj && option.color ? colorMap[option.color] : undefined;

        return (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className={`bg-white border rounded-xl px-5 py-4 text-left active:scale-[0.98] transition-all duration-200 text-sm font-medium ${
              color || "text-[#1a1a1a] border-gray-200 hover:border-[#D4A017] hover:bg-[#D4A017]/5"
            }`}
          >
            {emoji && <span className="mr-2 text-base">{emoji}</span>}
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ChatOptions;
