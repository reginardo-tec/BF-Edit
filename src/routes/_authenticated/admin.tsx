import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchProducts, uploadProductImage, deleteProductImage, resolveImageUrl, CATEGORIES, type Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, LogOut, Package, DollarSign, Boxes, ImagePlus, Truck, CreditCard, Wrench, BarChart3, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/cart";
import { SHIPPING_PROVIDERS, fetchShippingSettings, upsertShippingSetting, type ShippingSetting } from "@/lib/shipping";
import { PAYMENT_PROVIDERS, fetchPaymentSettings, upsertPaymentSetting, type PaymentSetting } from "@/lib/payments";
import { fetchSiteSettings, setMaintenanceMode, type SiteSettings } from "@/lib/site-settings";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminUploadsPanel } from "@/components/admin-uploads-panel";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
});

type FormState = {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stock: string;
  active: boolean;
  image_url: string | null;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  category: "personalizados",
  price: "",
  stock: "0",
  active: true,
  image_url: null,
};

function Admin() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);

  const load = () => {
    setLoading(true);
    fetchProducts({ includeInactive: true })
      .then(setProducts)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setForm(emptyForm);
    setImgFile(null);
    setImgPreview(null);
    setDialogOpen(true);
  };

  const openEdit = async (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description ?? "",
      category: p.category,
      price: String(p.price),
      stock: String(p.stock),
      active: p.active,
      image_url: p.image_url,
    });
    setImgFile(null);
    setImgPreview(await resolveImageUrl(p.image_url));
    setDialogOpen(true);
  };

  const onImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let image_url = form.image_url;
      if (imgFile) {
        if (form.image_url) await deleteProductImage(form.image_url);
        image_url = await uploadProductImage(imgFile);
      }
      const payload = {
        name: form.name,
        description: form.description || null,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        active: form.active,
        image_url,
      };
      if (form.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", form.id);
        if (error) throw error;
        toast.success("Produto atualizado");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Produto criado");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Excluir "${p.name}"?`)) return;
    try {
      if (p.image_url) await deleteProductImage(p.image_url);
      const { error } = await supabase.from("products").delete().eq("id", p.id);
      if (error) throw error;
      toast.success("Produto excluído");
      load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const activeCount = products.filter((p) => p.active).length;
  const stockValue = products.reduce((s, p) => s + Number(p.price) * p.stock, 0);

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="font-display text-lg font-semibold">BF Arte & Design</Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground md:inline">Painel admin</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Produtos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gerencie catálogo, estoque, valores e fotos.</p>
          </div>
          <Button onClick={openNew} size="lg" className="rounded-full">
            <Plus className="mr-1 h-4 w-4" /> Novo produto
          </Button>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard icon={Package} label="Produtos ativos" value={`${activeCount}/${products.length}`} />
          <StatCard icon={Boxes} label="Unidades em estoque" value={String(totalStock)} />
          <StatCard icon={DollarSign} label="Valor do estoque" value={formatBRL(stockValue)} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="m-2">
              <TabsTrigger value="dashboard"><BarChart3 className="mr-1.5 h-4 w-4" />Dashboard</TabsTrigger>
              <TabsTrigger value="produtos"><Package className="mr-1.5 h-4 w-4" />Produtos</TabsTrigger>
              <TabsTrigger value="envio"><Truck className="mr-1.5 h-4 w-4" />Envio & Frete</TabsTrigger>
              <TabsTrigger value="pagamento"><CreditCard className="mr-1.5 h-4 w-4" />Pagamentos</TabsTrigger>
              <TabsTrigger value="manutencao"><Wrench className="mr-1.5 h-4 w-4" />Manutenção</TabsTrigger>
              <TabsTrigger value="uploads"><UploadCloud className="mr-1.5 h-4 w-4" />Uploads</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="m-0 border-t border-border/60">
              <AdminDashboard />
            </TabsContent>
            <TabsContent value="produtos" className="m-0">
          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-muted-foreground">Ainda não há produtos cadastrados.</p>
              <Button onClick={openNew} className="mt-4 rounded-full"><Plus className="mr-1 h-4 w-4" />Adicionar o primeiro</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <ProductRow key={p.id} product={p} onEdit={() => openEdit(p)} onDelete={() => remove(p)} />
                ))}
              </TableBody>
            </Table>
          )}
            </TabsContent>
            <TabsContent value="envio" className="m-0 border-t border-border/60">
              <ShippingSettingsPanel />
            </TabsContent>
            <TabsContent value="pagamento" className="m-0 border-t border-border/60">
              <PaymentSettingsPanel />
            </TabsContent>
            <TabsContent value="manutencao" className="m-0 border-t border-border/60">
              <MaintenancePanel />
            </TabsContent>
            <TabsContent value="uploads" className="m-0 border-t border-border/60">
              <AdminUploadsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{form.id ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Imagem</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-xl border border-dashed border-border/70 bg-muted">
                  {imgPreview ? (
                    <img src={imgPreview} alt="preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Input type="file" accept="image/*" onChange={onImgChange} />
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="n">Nome</Label>
              <Input id="n" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="d">Descrição</Label>
              <Textarea id="d" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="p">Preço (R$)</Label>
              <Input id="p" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s">Estoque</Label>
              <Input id="s" type="number" min="0" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div className="flex items-end gap-3 pb-1">
              <Switch id="a" checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label htmlFor="a">Publicado na loja</Label>
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20"><Icon className="h-5 w-5 text-primary-foreground" /></div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-display text-2xl">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ product, onEdit, onDelete }: { product: Product; onEdit: () => void; onDelete: () => void }) {
  const [img, setImg] = useState<string | null>(null);
  useEffect(() => {
    resolveImageUrl(product.image_url).then(setImg);
  }, [product.image_url]);
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            {img && <img src={img} alt={product.name} className="h-full w-full object-cover" />}
          </div>
          <div>
            <p className="font-medium">{product.name}</p>
            {product.description && <p className="line-clamp-1 text-xs text-muted-foreground">{product.description}</p>}
          </div>
        </div>
      </TableCell>
      <TableCell className="capitalize text-muted-foreground">{product.category}</TableCell>
      <TableCell className="text-right font-medium">{formatBRL(Number(product.price))}</TableCell>
      <TableCell className="text-right">{product.stock}</TableCell>
      <TableCell>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${product.active ? "bg-primary/25 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {product.active ? "Ativo" : "Rascunho"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4 text-[var(--coral)]" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ShippingSettingsPanel() {
  const [items, setItems] = useState<ShippingSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchShippingSettings()
      .then(setItems)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (provider: string, patch: Partial<ShippingSetting>) => {
    setItems((prev) => prev.map((i) => (i.provider === provider ? { ...i, ...patch } : i)));
  };

  const save = async (item: ShippingSetting) => {
    setSavingId(item.id);
    try {
      await upsertShippingSetting(item.provider, {
        enabled: item.enabled,
        api_token: item.api_token,
        sender_zip: item.sender_zip,
        sender_name: item.sender_name,
      });
      toast.success("Configuração salva");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4 p-5">
      <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        Configure as credenciais das transportadoras. Depois de ativar, os pedidos poderão gerar etiquetas e cotações de frete através da plataforma escolhida.
      </div>
      {SHIPPING_PROVIDERS.map((p) => {
        const item = items.find((i) => i.provider === p.value);
        if (!item) return null;
        return (
          <div key={p.value} className="rounded-2xl border border-border/60 bg-background p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-display text-xl">{p.label}</h3>
                  {item.enabled && <span className="rounded-full bg-primary/25 px-2 py-0.5 text-xs text-primary-foreground">Ativo</span>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.help}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={item.enabled} onCheckedChange={(v) => update(p.value, { enabled: v })} />
                <Label className="text-xs">Ativar</Label>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Token / Chave de API</Label>
                <Input
                  type="password"
                  placeholder="Cole a chave da transportadora"
                  value={item.api_token ?? ""}
                  onChange={(e) => update(p.value, { api_token: e.target.value })}
                />
              </div>
              <div>
                <Label>CEP de origem</Label>
                <Input
                  placeholder="00000-000"
                  value={item.sender_zip ?? ""}
                  onChange={(e) => update(p.value, { sender_zip: e.target.value })}
                />
              </div>
              <div>
                <Label>Nome do remetente</Label>
                <Input
                  placeholder="BF Arte & Design"
                  value={item.sender_name ?? ""}
                  onChange={(e) => update(p.value, { sender_name: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={() => save(item)} disabled={savingId === item.id}>
                {savingId === item.id ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaymentSettingsPanel() {
  const [items, setItems] = useState<PaymentSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentSettings()
      .then(setItems)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const update = (provider: string, patch: Partial<PaymentSetting>) => {
    setItems((prev) => prev.map((i) => (i.provider === provider ? { ...i, ...patch } : i)));
  };

  const save = async (item: PaymentSetting) => {
    setSavingId(item.id);
    try {
      // If enabling this one, disable the others (single active gateway)
      if (item.enabled) {
        for (const other of items) {
          if (other.provider !== item.provider && other.enabled) {
            await upsertPaymentSetting(other.provider, { enabled: false });
          }
        }
      }
      await upsertPaymentSetting(item.provider, {
        enabled: item.enabled,
        access_token: item.access_token,
        public_key: item.public_key,
        sandbox: item.sandbox,
      });
      toast.success("Configuração salva");
      const fresh = await fetchPaymentSettings();
      setItems(fresh);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-4 p-5">
      <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        Configure o gateway de pagamento para receber online (cartão, Pix, boleto). Apenas <strong>um</strong> gateway pode ficar ativo por vez — o carrinho usará essa integração ao finalizar. O botão de WhatsApp continua disponível como alternativa.
      </div>
      {PAYMENT_PROVIDERS.map((p) => {
        const item = items.find((i) => i.provider === p.value);
        if (!item) return null;
        return (
          <div key={p.value} className="rounded-2xl border border-border/60 bg-background p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-display text-xl">{p.label}</h3>
                  {item.enabled && (
                    <span className="rounded-full bg-primary/25 px-2 py-0.5 text-xs text-primary-foreground">
                      Ativo
                    </span>
                  )}
                  {p.value === "mercado_pago" && (
                    <span className="rounded-full bg-[var(--coral)]/20 px-2 py-0.5 text-xs text-[var(--coral)]">
                      Recomendado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.help}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.enabled}
                  onCheckedChange={(v) => update(p.value, { enabled: v })}
                />
                <Label className="text-xs">Ativar</Label>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>{p.tokenLabel}</Label>
                <Input
                  type="password"
                  placeholder="Cole a chave secreta"
                  value={item.access_token ?? ""}
                  onChange={(e) => update(p.value, { access_token: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>{p.publicKeyLabel}</Label>
                <Input
                  placeholder="Chave pública (opcional)"
                  value={item.public_key ?? ""}
                  onChange={(e) => update(p.value, { public_key: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3 pt-1 md:col-span-2">
                <Switch
                  id={`sandbox-${p.value}`}
                  checked={item.sandbox}
                  onCheckedChange={(v) => update(p.value, { sandbox: v })}
                />
                <Label htmlFor={`sandbox-${p.value}`} className="text-sm">
                  Modo teste (sandbox) — desative para receber pagamentos reais
                </Label>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={() => save(item)} disabled={savingId === item.id}>
                {savingId === item.id ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MaintenancePanel() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (enabled: boolean) => {
    if (!settings?.id) return;
    setSaving(true);
    try {
      await setMaintenanceMode(settings.id, enabled);
      setSettings({ ...settings, maintenance_mode: enabled });
      toast.success(enabled ? "Modo manutenção ativado" : "Modo manutenção desativado");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>;

  const enabled = !!settings?.maintenance_mode;

  return (
    <div className="space-y-4 p-5">
      <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
        Ative o modo manutenção para exibir uma página de aviso a todos os visitantes. As páginas <strong>/admin</strong> e <strong>/auth</strong> continuam acessíveis para você continuar trabalhando no site normalmente.
      </div>
      <div className="rounded-2xl border border-border/60 bg-background p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-display text-xl">Modo manutenção</h3>
              {enabled && (
                <span className="rounded-full bg-[var(--coral)]/20 px-2 py-0.5 text-xs text-[var(--coral)]">
                  Ativo
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando ativo, qualquer pessoa que acessar o site (início, catálogo, sobre, contato...) será redirecionada para a página de manutenção.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={enabled} disabled={saving} onCheckedChange={toggle} />
            <Label className="text-xs">{enabled ? "Ativo" : "Inativo"}</Label>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <a href="/manutencao" target="_blank" rel="noreferrer">Ver página de manutenção</a>
          </Button>
        </div>
      </div>
    </div>
  );
}