import avatarImg from "@/assets/avatar-consultant.jpg";

interface ChatBubbleProps {
  message: string;
  isUser?: boolean;
  boldName?: string;
}

const ChatBubble = ({ message, isUser = false, boldName }: ChatBubbleProps) => {
  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="bg-[#D4A017] text-white px-5 py-3 rounded-2xl max-w-xs font-medium text-lg">
          {message}
        </div>
      </div>
    );
  }

  const renderMessage = () => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    const msg = message;

    while ((match = linkRegex.exec(msg)) !== null) {
      if (match.index > lastIndex) {
        parts.push(msg.slice(lastIndex, match.index));
      }
      parts.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline font-semibold hover:text-[#b8891a]">
          {match[1]}
        </a>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < msg.length) {
      parts.push(msg.slice(lastIndex));
    }

    if (parts.length === 0) {
      if (boldName) {
        const bParts = message.split(boldName);
        return <>{bParts[0]}<strong className="font-bold">{boldName}</strong>{bParts[1] || ""}</>;
      }
      return message;
    }

    return <>{parts}</>;
  };

  return (
    <div className="flex items-start gap-3 animate-fade-in-up">
      <img
        src={avatarImg}
        alt="Olívia - Atendente Orbit"
        className="w-14 h-14 rounded-full object-cover object-[center_20%] flex-shrink-0"
      />
      <div className="bg-[#F0F0F0] text-[#1a1a1a] px-5 py-4 rounded-2xl max-w-md leading-relaxed text-lg">
        {renderMessage()}
      </div>
    </div>
  );
};

export default ChatBubble;
