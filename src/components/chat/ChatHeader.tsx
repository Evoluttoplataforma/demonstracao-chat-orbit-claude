interface ChatHeaderProps {
  currentStep: number;
  totalSteps: number;
}

const ChatHeader = ({ currentStep, totalSteps }: ChatHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0 bg-white">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#D4A017] flex items-center justify-center">
          <span className="text-white font-bold text-sm">O</span>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[#1a1a1a] text-lg leading-tight">Olívia</span>
          <span className="text-xs text-gray-500 leading-tight">Atendente Orbit</span>
        </div>
      </div>

      <div className="flex-1 mx-8 flex items-center gap-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div
              className={`h-1 w-full rounded-full transition-colors duration-300 ${
                i < currentStep ? "bg-[#D4A017]" : "bg-gray-200"
              }`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-3xl font-bold text-[#1a1a1a]">{currentStep}</span>
        <span className="text-gray-400 text-sm">de {totalSteps}</span>
      </div>
    </header>
  );
};

export default ChatHeader;
