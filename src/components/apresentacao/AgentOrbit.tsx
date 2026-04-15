import { useEffect, useRef, useState, useMemo } from "react";
import {
  Target, FolderCog, Users, GraduationCap,
  BarChart3, SearchCheck, ShieldAlert, Lightbulb,
  AlertTriangle, FileText, Handshake, Video,
} from "lucide-react";
import oliviaImg from "@/assets/olivia-orbit.png";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const AGENTS = [
  { name: "Estrategista", desc: "SWOT, BSC e planejamento", equivalent: "Consultor — R$30-80k/proj", Icon: Target },
  { name: "Processos", desc: "Mapeamento, playbooks e automação", equivalent: "Analista sênior — R$8-12k/mês", Icon: FolderCog },
  { name: "Pessoas", desc: "Cargos, desempenho e PDIs", equivalent: "Analista DHO — R$6-10k/mês", Icon: Users },
  { name: "Treinamento", desc: "Microlearning e trilhas via WhatsApp", equivalent: "Coord. T&D — R$7-12k/mês", Icon: GraduationCap },
  { name: "Indicadores", desc: "KPIs em tempo real e causa raiz", equivalent: "Analista BI — R$8-15k/mês", Icon: BarChart3 },
  { name: "Pesquisa", desc: "Clima, formulários e insights", equivalent: "Analista dados — R$6-10k/mês", Icon: SearchCheck },
  { name: "Riscos", desc: "Mitigação e prevenção contínua", equivalent: "Analista riscos — R$8-12k/mês", Icon: ShieldAlert },
  { name: "Oportunidades", desc: "Mercado, parcerias e expansão", equivalent: "Analista intel. — R$8-12k/mês", Icon: Lightbulb },
  { name: "Problemas", desc: "Não-conformidades e PDCA", equivalent: "Analista melhoria — R$7-10k/mês", Icon: AlertTriangle },
  { name: "Documentos", desc: "Padronização e controle", equivalent: "Analista doc. — R$5-8k/mês", Icon: FileText },
  { name: "Vendas", desc: "CRM, funil e coaching comercial", equivalent: "Consultor com. — R$10-15k/mês", Icon: Handshake },
  { name: "Reuniões", desc: "Transcrição e planos de ação", equivalent: "Assist. exec. — R$5-8k/mês", Icon: Video },
];

interface Props {
  active: boolean;
}

export default function AgentOrbit({ active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(860);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      // Reserve ~220px for header/bubble/title/subtitle/banner/nav
      const availableH = window.innerHeight - 220;
      const widthBased = w < 480 ? 360 : w < 768 ? 420 : Math.min(860, w);
      setSize(Math.max(300, Math.min(widthBased, availableH)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const isMobile = size <= 420;
  const isSmall = size <= 360;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.42;

  const photoSize = isSmall ? 56 : isMobile ? 70 : 140;
  const iconSize = isSmall ? 30 : isMobile ? 36 : 56;
  const nodeIconLucide = isSmall ? 12 : isMobile ? 14 : 20;

  const positions = useMemo(() =>
    AGENTS.map((_, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
    }), [cx, cy, radius]
  );

  return (
    <div ref={containerRef} className="w-full max-w-[860px]">
      <div
        className={`relative mx-auto ${active ? "orbit-visible" : ""}`}
        style={{ width: size, height: size }}
      >
        {/* SVG animated energy lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 orbit-lines" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <filter id="line-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {positions.map((p, i) => {
            const dx = p.x - cx;
            const dy = p.y - cy;
            const len = Math.sqrt(dx * dx + dy * dy);
            const extraTrim = [5, 6, 7].includes(i) ? (isMobile ? 14 : 18) : 4;
            const endX = p.x - (dx / len) * (iconSize / 2 + extraTrim);
            const endY = p.y - (dy / len) * (iconSize / 2 + extraTrim);
            return (
              <g key={i}>
                {/* Base line - subtle static */}
                <line
                  x1={cx} y1={cy} x2={endX} y2={endY}
                  stroke="rgba(212,160,23,0.08)"
                  strokeWidth="1"
                />
                {/* Animated energy pulse line */}
                <line
                  x1={cx} y1={cy} x2={endX} y2={endY}
                  stroke="rgba(212,160,23,0.5)"
                  strokeWidth="2"
                  strokeDasharray="6 18"
                  filter="url(#line-glow)"
                  className="orbit-energy-line"
                  style={{ animationDelay: `${i * 0.25}s` }}
                />
                {/* Secondary faster pulse */}
                <line
                  x1={cx} y1={cy} x2={endX} y2={endY}
                  stroke="rgba(212,160,23,0.25)"
                  strokeWidth="1"
                  strokeDasharray="3 21"
                  className="orbit-energy-line-fast"
                  style={{ animationDelay: `${i * 0.15 + 0.5}s` }}
                />
              </g>
            );
          })}
        </svg>

        {/* Pulsating rings */}
        {[
          { s: isSmall ? 90 : isMobile ? 110 : 180, delay: "0s", show: true },
          { s: isSmall ? 0 : isMobile ? 140 : 220, delay: "0.5s", show: !isSmall },
          { s: isMobile ? 0 : 264, delay: "1s", show: !isMobile },
        ].filter(r => r.show && r.s > 0).map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none orbit-ring"
            style={{
              width: r.s, height: r.s,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              border: `1.5px solid rgba(212,160,23,${0.12 - i * 0.04})`,
              animationDelay: r.delay,
            }}
          />
        ))}

        {/* Center: Olívia */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-[3] orbit-center">
          {/* Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none orbit-glow"
            style={{
              width: isSmall ? 90 : isMobile ? 120 : 260,
              height: isSmall ? 90 : isMobile ? 120 : 260,
              background: "radial-gradient(circle, rgba(212,160,23,0.2) 0%, rgba(212,160,23,0.05) 50%, transparent 70%)",
            }}
          />
          {/* Photo */}
          <div
            className="rounded-full overflow-hidden relative z-[2] orbit-photo"
            style={{
              width: photoSize, height: photoSize,
              border: `${isSmall ? 2 : isMobile ? 3 : 4}px solid rgba(212,160,23,0.6)`,
              boxShadow: "0 0 40px rgba(212,160,23,0.4), 0 0 80px rgba(212,160,23,0.15)",
            }}
          >
            <img src={oliviaImg} alt="Olívia" className="w-full h-full object-cover rounded-full" />
          </div>
          <span
            className="font-extrabold uppercase tracking-wider"
            style={{
              color: "#D4A017",
              fontSize: isSmall ? 11 : isMobile ? 13 : 20,
              marginTop: isSmall ? 6 : isMobile ? 8 : 14,
            }}
          >
            OLÍVIA
          </span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: isSmall ? 9 : isMobile ? 10 : 13, marginTop: 4 }}>
            Coordenadora Geral
          </span>
        </div>

        {/* Agent nodes */}
        {AGENTS.map((agent, i) => (
          <TooltipProvider key={i} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute flex flex-col items-center z-[2] orbit-node group cursor-pointer"
                  data-idx={i}
                  style={{
                    left: positions[i].x,
                    top: positions[i].y,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className="rounded-full flex items-center justify-center transition-all duration-300 group-hover:border-[#D4A017] group-hover:shadow-[0_0_24px_rgba(212,160,23,0.5)]"
                    style={{
                      width: iconSize, height: iconSize,
                      background: "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.04))",
                      border: "2px solid rgba(212,160,23,0.3)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <agent.Icon size={nodeIconLucide} color="#D4A017" />
                  </div>
                  <span
                    className="font-extrabold whitespace-nowrap"
                    style={{
                      color: "#fff",
                      fontSize: isSmall ? 9 : isMobile ? 10 : 14,
                      textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                      marginTop: 4,
                    }}
                  >
                    {agent.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-[#1a1a2e] border-[#D4A017]/30 text-white px-4 py-3 max-w-[220px]"
              >
                <p className="text-sm font-medium text-white/90">{agent.desc}</p>
                <p className="text-xs font-semibold text-[#D4A017] mt-1">{agent.equivalent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {/* Animations */}
      <style>{`
        .orbit-glow {
          animation: orbit-glow 3.5s ease-in-out infinite;
        }
        @keyframes orbit-glow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
        }
        .orbit-photo {
          animation: orbit-photo-breathe 3.5s ease-in-out infinite;
        }
        @keyframes orbit-photo-breathe {
          0%, 100% { box-shadow: 0 0 40px rgba(212,160,23,0.4), 0 0 80px rgba(212,160,23,0.15); }
          50% { box-shadow: 0 0 50px rgba(212,160,23,0.6), 0 0 100px rgba(212,160,23,0.25); }
        }
        .orbit-ring {
          animation: orbit-ring 3.5s ease-in-out infinite;
        }
        @keyframes orbit-ring {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        /* Energy pulse traveling along lines */
        .orbit-energy-line {
          animation: orbit-pulse-line 2.5s linear infinite;
        }
        @keyframes orbit-pulse-line {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -48; }
        }
        .orbit-energy-line-fast {
          animation: orbit-pulse-line-fast 1.8s linear infinite;
        }
        @keyframes orbit-pulse-line-fast {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -48; }
        }

        .orbit-center {
          opacity: 0;
          scale: 0.3;
        }
        .orbit-visible .orbit-center {
          animation: orbit-center-in 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        @keyframes orbit-center-in {
          to { opacity: 1; scale: 1; }
        }
        .orbit-lines {
          opacity: 0;
        }
        .orbit-visible .orbit-lines {
          animation: orbit-lines-in 0.8s ease 0.3s forwards;
        }
        @keyframes orbit-lines-in {
          to { opacity: 1; }
        }
        .orbit-node {
          opacity: 0;
          scale: 0.5;
        }
        .orbit-visible .orbit-node {
          animation: orbit-node-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        ${AGENTS.map((_, i) => `.orbit-visible .orbit-node[data-idx="${i}"] { animation-delay: ${0.1 + i * 0.05}s; }`).join("\n")}
        @keyframes orbit-node-in {
          to { opacity: 1; scale: 1; }
        }
      `}</style>
    </div>
  );
}
