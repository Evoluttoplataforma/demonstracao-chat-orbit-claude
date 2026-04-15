import oliviaImg from "@/assets/olivia-real-optimized.jpg";

interface Props {
  text: string;
  position?: "left" | "center";
}

export default function OliviaBubble({ text, position = "left" }: Props) {
  const align = position === "center" ? "justify-center" : "justify-start";
  return (
    <div className={`flex items-start gap-3 ${align} max-w-3xl ${position === "center" ? "mx-auto" : ""}`}>
      <img
        src={oliviaImg}
        alt="Olívia"
        className="w-11 h-11 rounded-full object-cover object-[center_20%] shrink-0 border-2"
        style={{ borderColor: "#D4A017" }}
      />
      <div
        className="px-5 py-3.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed max-w-xl"
        style={{ background: "#1C2333", color: "#C9D1D9", border: "1px solid rgba(212,160,23,0.2)" }}
      >
        {text}
      </div>
    </div>
  );
}
