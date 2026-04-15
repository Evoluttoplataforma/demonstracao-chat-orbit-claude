import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Vendedor {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  ativo: boolean;
  created_at: string;
}

const vendedorSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido").max(20),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(100),
});

const VendedoresTab = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", whatsapp: "", senha: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchVendedores = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vendedores")
      .select("*")
      .order("created_at", { ascending: false });
    setVendedores((data as Vendedor[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const handleSubmit = async () => {
    const result = vendedorSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    const { data, error } = await supabase.functions.invoke('create-vendedor', {
      body: {
        nome: result.data.nome,
        email: result.data.email,
        whatsapp: result.data.whatsapp,
        senha: result.data.senha,
      },
    });

    setSaving(false);
    if (error || (data && !data.success)) {
      toast.error(data?.error || "Erro ao cadastrar vendedor");
      return;
    }

    toast.success("Vendedor cadastrado com acesso ao sistema!");
    setForm({ nome: "", email: "", whatsapp: "", senha: "" });
    setShowForm(false);
    fetchVendedores();
  };

  const toggleAtivo = async (v: Vendedor) => {
    const { error } = await supabase
      .from("vendedores")
      .update({ ativo: !v.ativo })
      .eq("id", v.id);
    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    setVendedores((prev) =>
      prev.map((item) => (item.id === v.id ? { ...item, ativo: !item.ativo } : item))
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este vendedor?")) return;
    const { error } = await supabase.from("vendedores").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir vendedor");
      return;
    }
    toast.success("Vendedor excluído");
    setVendedores((prev) => prev.filter((v) => v.id !== id));
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-12">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {vendedores.length} vendedor(es) • {vendedores.filter((v) => v.ativo).length} ativo(s)
        </p>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo Vendedor
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <div>
            <Input
              placeholder="Nome do vendedor"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className={errors.nome ? "border-destructive" : ""}
            />
            {errors.nome && <p className="text-destructive text-xs mt-1">{errors.nome}</p>}
          </div>
          <div>
            <Input
              placeholder="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <Input
              placeholder="WhatsApp (ex: 71999998888)"
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              className={errors.whatsapp ? "border-destructive" : ""}
            />
            {errors.whatsapp && <p className="text-destructive text-xs mt-1">{errors.whatsapp}</p>}
          </div>
          <div>
            <Input
              placeholder="Senha de acesso"
              type="password"
              value={form.senha}
              onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
              className={errors.senha ? "border-destructive" : ""}
            />
            {errors.senha && <p className="text-destructive text-xs mt-1">{errors.senha}</p>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setErrors({}); }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {vendedores.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhum vendedor cadastrado.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendedores.map((v) => (
                <TableRow key={v.id} className={!v.ativo ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{v.nome}</TableCell>
                  <TableCell>{v.email}</TableCell>
                  <TableCell>
                    <a
                      href={`https://wa.me/${v.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {v.whatsapp}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={v.ativo ? "default" : "outline"}>
                      {v.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAtivo(v)}
                        title={v.ativo ? "Desativar" : "Ativar"}
                        className="h-8 w-8"
                      >
                        {v.ativo ? (
                          <ToggleRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(v.id)}
                        title="Excluir"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default VendedoresTab;
