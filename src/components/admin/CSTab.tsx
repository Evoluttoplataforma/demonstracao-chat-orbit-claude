import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CSUser {
  id: string;
  user_id: string;
  role: string;
  email?: string;
}

const CSTab = () => {
  const [users, setUsers] = useState<CSUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [saving, setSaving] = useState(false);

  const fetchCSUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_roles")
      .select("id, user_id, role")
      .eq("role", "cs");
    setUsers((data as CSUser[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCSUsers();
  }, []);

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (form.senha.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke("create-cs-user", {
      body: { nome: form.nome.trim(), email: form.email.trim(), senha: form.senha },
    });
    setSaving(false);

    if (error || (data && !data.success)) {
      toast.error(data?.error || "Erro ao cadastrar usuário CS");
      return;
    }

    toast.success("Usuário CS cadastrado com sucesso!");
    setForm({ nome: "", email: "", senha: "" });
    setShowForm(false);
    fetchCSUsers();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário CS?")) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "cs");
    if (error) {
      toast.error("Erro ao remover usuário");
      return;
    }
    toast.success("Usuário CS removido");
    fetchCSUsers();
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-12">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} usuário(s) CS
        </p>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo CS
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <Input
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          />
          <Input
            placeholder="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            placeholder="Senha de acesso"
            type="password"
            value={form.senha}
            onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhum usuário CS cadastrado.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.user_id}</TableCell>
                  <TableCell>
                    <Badge>CS</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(u.user_id)}
                      title="Remover"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default CSTab;
