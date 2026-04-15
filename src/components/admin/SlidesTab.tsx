import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, Sparkles, Loader2, Wand2, Eye, EyeOff } from "lucide-react";

interface SlideContent {
  tag?: string;
  subtitle?: string;
  body?: string;
  items?: string[];
  cards?: Array<{ title: string; desc: string; badge?: string }>;
  stats?: Array<{ value: string; label: string }>;
  steps?: Array<{ num: string; title: string; desc: string }>;
  comparisons?: Array<{ before: string; after: string }>;
  footer?: string;
  buttonText?: string;
  buttonLink?: string;
  badges?: string[];
  highlight?: string;
}

export interface PresentationSlide {
  id: string;
  slide_order: number;
  layout_type: string;
  title: string;
  content: SlideContent;
  is_active: boolean;
}

const LAYOUTS = [
  { value: "hero", label: "Capa (Hero)" },
  { value: "statement", label: "Afirmação" },
  { value: "stats", label: "Estatísticas" },
  { value: "split", label: "Lista Dividida" },
  { value: "cards", label: "Cards" },
  { value: "steps", label: "Passos" },
  { value: "comparison", label: "Antes/Depois" },
  { value: "cta", label: "Call to Action" },
];

const LAYOUT_FIELDS: Record<string, string[]> = {
  hero: ["subtitle", "highlight", "badges"],
  statement: ["tag", "body"],
  stats: ["tag", "subtitle", "stats", "footer"],
  split: ["tag", "subtitle", "items"],
  cards: ["tag", "subtitle", "cards", "footer"],
  steps: ["tag", "subtitle", "steps"],
  comparison: ["tag", "subtitle", "comparisons"],
  cta: ["subtitle", "buttonText", "buttonLink", "badges"],
};

/* ─── Content Editor ─── */
function ContentEditor({ layout, content, onChange }: { layout: string; content: SlideContent; onChange: (c: SlideContent) => void }) {
  const fields = LAYOUT_FIELDS[layout] || [];
  const upd = (k: string, v: any) => onChange({ ...content, [k]: v });

  return (
    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
      {fields.includes("tag") && (
        <div><Label>Tag / Categoria</Label><Input value={content.tag || ""} onChange={e => upd("tag", e.target.value)} /></div>
      )}
      {fields.includes("subtitle") && (
        <div><Label>Subtítulo</Label><Textarea rows={3} value={content.subtitle || ""} onChange={e => upd("subtitle", e.target.value)} /></div>
      )}
      {fields.includes("highlight") && (
        <div><Label>Texto destacado (parte do título em cor)</Label><Input value={content.highlight || ""} onChange={e => upd("highlight", e.target.value)} /></div>
      )}
      {fields.includes("body") && (
        <div><Label>Corpo do texto</Label><Textarea rows={6} value={content.body || ""} onChange={e => upd("body", e.target.value)} /></div>
      )}
      {fields.includes("footer") && (
        <div><Label>Rodapé</Label><Textarea rows={2} value={content.footer || ""} onChange={e => upd("footer", e.target.value)} /></div>
      )}
      {fields.includes("buttonText") && (
        <div><Label>Texto do botão</Label><Input value={content.buttonText || ""} onChange={e => upd("buttonText", e.target.value)} /></div>
      )}
      {fields.includes("buttonLink") && (
        <div><Label>Link do botão</Label><Input value={content.buttonLink || ""} onChange={e => upd("buttonLink", e.target.value)} /></div>
      )}

      {/* Items (split layout) */}
      {fields.includes("items") && (
        <div>
          <Label>Itens da lista</Label>
          {(content.items || []).map((item, i) => (
            <div key={i} className="flex gap-2 mt-2">
              <Input value={item} onChange={e => { const arr = [...(content.items || [])]; arr[i] = e.target.value; upd("items", arr); }} />
              <Button variant="ghost" size="icon" onClick={() => upd("items", (content.items || []).filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => upd("items", [...(content.items || []), ""])}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
        </div>
      )}

      {/* Stats */}
      {fields.includes("stats") && (
        <div>
          <Label>Estatísticas</Label>
          {(content.stats || []).map((s, i) => (
            <div key={i} className="flex gap-2 mt-2">
              <Input placeholder="Valor" className="w-28" value={s.value} onChange={e => { const arr = [...(content.stats || [])]; arr[i] = { ...s, value: e.target.value }; upd("stats", arr); }} />
              <Input placeholder="Descrição" value={s.label} onChange={e => { const arr = [...(content.stats || [])]; arr[i] = { ...s, label: e.target.value }; upd("stats", arr); }} />
              <Button variant="ghost" size="icon" onClick={() => upd("stats", (content.stats || []).filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => upd("stats", [...(content.stats || []), { value: "", label: "" }])}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
        </div>
      )}

      {/* Cards */}
      {fields.includes("cards") && (
        <div>
          <Label>Cards</Label>
          {(content.cards || []).map((c, i) => (
            <div key={i} className="border border-border rounded-lg p-3 mt-2 space-y-2">
              <Input placeholder="Título" value={c.title} onChange={e => { const arr = [...(content.cards || [])]; arr[i] = { ...c, title: e.target.value }; upd("cards", arr); }} />
              <Textarea placeholder="Descrição" rows={2} value={c.desc} onChange={e => { const arr = [...(content.cards || [])]; arr[i] = { ...c, desc: e.target.value }; upd("cards", arr); }} />
              <Input placeholder="Badge (opcional)" value={c.badge || ""} onChange={e => { const arr = [...(content.cards || [])]; arr[i] = { ...c, badge: e.target.value }; upd("cards", arr); }} />
              <Button variant="ghost" size="sm" onClick={() => upd("cards", (content.cards || []).filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 mr-1" /> Remover</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => upd("cards", [...(content.cards || []), { title: "", desc: "" }])}><Plus className="h-3 w-3 mr-1" /> Adicionar Card</Button>
        </div>
      )}

      {/* Steps */}
      {fields.includes("steps") && (
        <div>
          <Label>Passos</Label>
          {(content.steps || []).map((s, i) => (
            <div key={i} className="border border-border rounded-lg p-3 mt-2 space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Nº" className="w-16" value={s.num} onChange={e => { const arr = [...(content.steps || [])]; arr[i] = { ...s, num: e.target.value }; upd("steps", arr); }} />
                <Input placeholder="Título" value={s.title} onChange={e => { const arr = [...(content.steps || [])]; arr[i] = { ...s, title: e.target.value }; upd("steps", arr); }} />
              </div>
              <Textarea placeholder="Descrição" rows={2} value={s.desc} onChange={e => { const arr = [...(content.steps || [])]; arr[i] = { ...s, desc: e.target.value }; upd("steps", arr); }} />
              <Button variant="ghost" size="sm" onClick={() => upd("steps", (content.steps || []).filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 mr-1" /> Remover</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => upd("steps", [...(content.steps || []), { num: String((content.steps?.length || 0) + 1).padStart(2, "0"), title: "", desc: "" }])}><Plus className="h-3 w-3 mr-1" /> Adicionar Passo</Button>
        </div>
      )}

      {/* Comparisons */}
      {fields.includes("comparisons") && (
        <div>
          <Label>Comparações (Antes → Depois)</Label>
          {(content.comparisons || []).map((c, i) => (
            <div key={i} className="flex gap-2 mt-2 items-center">
              <Input placeholder="Antes" value={c.before} onChange={e => { const arr = [...(content.comparisons || [])]; arr[i] = { ...c, before: e.target.value }; upd("comparisons", arr); }} />
              <span className="text-muted-foreground">→</span>
              <Input placeholder="Depois" value={c.after} onChange={e => { const arr = [...(content.comparisons || [])]; arr[i] = { ...c, after: e.target.value }; upd("comparisons", arr); }} />
              <Button variant="ghost" size="icon" onClick={() => upd("comparisons", (content.comparisons || []).filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => upd("comparisons", [...(content.comparisons || []), { before: "", after: "" }])}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
        </div>
      )}

      {/* Badges */}
      {fields.includes("badges") && (
        <div>
          <Label>Badges</Label>
          {(content.badges || []).map((b, i) => (
            <div key={i} className="flex gap-2 mt-2">
              <Input value={b} onChange={e => { const arr = [...(content.badges || [])]; arr[i] = e.target.value; upd("badges", arr); }} />
              <Button variant="ghost" size="icon" onClick={() => upd("badges", (content.badges || []).filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-2" onClick={() => upd("badges", [...(content.badges || []), ""])}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function SlidesTab() {
  const [slides, setSlides] = useState<PresentationSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PresentationSlide | null>(null);
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiEditId, setAiEditId] = useState<string | null>(null);
  const [aiEditPrompt, setAiEditPrompt] = useState("");

  const fetchSlides = async () => {
    const { data } = await supabase
      .from("presentation_slides")
      .select("*")
      .order("slide_order");
    setSlides((data as unknown as PresentationSlide[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSlides(); }, []);

  const moveSlide = async (index: number, dir: -1 | 1) => {
    const ni = index + dir;
    if (ni < 0 || ni >= slides.length) return;
    const a = slides[index], b = slides[ni];
    await Promise.all([
      supabase.from("presentation_slides").update({ slide_order: b.slide_order }).eq("id", a.id),
      supabase.from("presentation_slides").update({ slide_order: a.slide_order }).eq("id", b.id),
    ]);
    fetchSlides();
  };

  const deleteSlide = async (id: string) => {
    if (!confirm("Excluir este slide?")) return;
    await supabase.from("presentation_slides").delete().eq("id", id);
    toast.success("Slide excluído");
    await fetchSlides();
  };

  const toggleVisibility = async (slide: PresentationSlide) => {
    await supabase.from("presentation_slides").update({ is_active: !slide.is_active }).eq("id", slide.id);
    toast.success(slide.is_active ? "Slide ocultado" : "Slide visível");
    fetchSlides();
  };

  const saveSlide = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = {
      title: editing.title,
      layout_type: editing.layout_type,
      content: editing.content as any,
    };
    const { error } = editing.id
      ? await supabase.from("presentation_slides").update(payload).eq("id", editing.id)
      : await supabase.from("presentation_slides").insert({ ...payload, slide_order: slides.length });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Slide salvo");
    setEditing(null);
    fetchSlides();
  };

  const addNewSlide = () => {
    setEditing({
      id: "",
      slide_order: slides.length,
      layout_type: "statement",
      title: "Novo Slide",
      content: { tag: "", body: "" },
      is_active: true,
    });
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-slide", {
        body: { prompt: aiPrompt },
      });
      if (error) throw error;
      if (data?.slide) {
        setEditing({
          id: "",
          slide_order: slides.length,
          layout_type: data.slide.layoutType || "statement",
          title: data.slide.title || "Novo Slide",
          content: data.slide.content || {},
          is_active: true,
        });
        setShowAI(false);
        setAiPrompt("");
        toast.success("Slide gerado com IA! Revise e salve.");
      }
    } catch {
      toast.error("Erro ao gerar com IA");
    }
    setAiLoading(false);
  };

  const editWithAI = async (slideId: string) => {
    if (!aiEditPrompt.trim()) return;
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-slide", {
        body: {
          prompt: aiEditPrompt,
          existingSlide: { title: slide.title, layoutType: slide.layout_type, content: slide.content },
        },
      });
      if (error) throw error;
      if (data?.slide) {
        await supabase.from("presentation_slides").update({
          title: data.slide.title || slide.title,
          layout_type: data.slide.layoutType || slide.layout_type,
          content: (data.slide.content || slide.content) as any,
        }).eq("id", slide.id);
        toast.success("Slide atualizado com IA!");
        fetchSlides();
      }
    } catch {
      toast.error("Erro ao editar com IA");
    }
    setAiLoading(false);
    setAiEditId(null);
    setAiEditPrompt("");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button onClick={addNewSlide}><Plus className="h-4 w-4 mr-1" /> Novo Slide</Button>
          <Button variant="outline" onClick={() => setShowAI(true)}><Sparkles className="h-4 w-4 mr-1" /> Criar com IA</Button>
        </div>
        <a href="/apresentacao" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" /> Ver Apresentação</Button>
        </a>
      </div>

      {/* Slides list */}
      <div className="space-y-2">
        {slides.map((slide, i) => (
          <div key={slide.id} className={`border border-border rounded-lg p-3 flex items-center gap-3 bg-card ${!slide.is_active ? "opacity-50" : ""}`}>
            <span className="text-xs text-muted-foreground font-mono w-6 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{slide.title}</p>
              <span className="text-xs text-muted-foreground">{LAYOUTS.find(l => l.value === slide.layout_type)?.label || slide.layout_type}{!slide.is_active && " • Oculto"}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleVisibility(slide)} title={slide.is_active ? "Ocultar slide" : "Mostrar slide"}>{slide.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}</Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSlide(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1}><ArrowDown className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setAiEditId(slide.id); setAiEditPrompt(""); }}><Wand2 className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ ...slide })}><Pencil className="h-3 w-3" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSlide(slide.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
      </div>

      {slides.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhum slide criado. Clique em "Novo Slide" ou "Criar com IA".</p>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar Slide" : "Novo Slide"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div>
                <Label>Título</Label>
                <Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Layout</Label>
                <Select value={editing.layout_type} onValueChange={v => setEditing({ ...editing, layout_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <ContentEditor
                layout={editing.layout_type}
                content={editing.content}
                onChange={c => setEditing({ ...editing, content: c })}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveSlide} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Create Dialog */}
      <Dialog open={showAI} onOpenChange={o => !o && setShowAI(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Slide com IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Descreva o slide que quer criar. A IA vai gerar o conteúdo e sugerir o melhor layout.</p>
            <Textarea
              rows={4}
              placeholder="Ex: Crie um slide mostrando os benefícios do Orbit para consultores, com 3 cards comparando antes e depois..."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAI(false)}>Cancelar</Button>
            <Button onClick={generateWithAI} disabled={aiLoading || !aiPrompt.trim()}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />} Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Edit Dialog */}
      <Dialog open={!!aiEditId} onOpenChange={o => !o && setAiEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar com IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Descreva o que quer mudar neste slide.</p>
            <Textarea
              rows={3}
              placeholder="Ex: Torne o texto mais agressivo e direto, adicione mais urgência..."
              value={aiEditPrompt}
              onChange={e => setAiEditPrompt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiEditId(null)}>Cancelar</Button>
            <Button onClick={() => aiEditId && editWithAI(aiEditId)} disabled={aiLoading || !aiEditPrompt.trim()}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Wand2 className="h-4 w-4 mr-1" />} Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
