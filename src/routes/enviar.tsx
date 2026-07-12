import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UploadCloud, FolderUp, FileUp, X, CheckCircle2, Loader2 } from "lucide-react";
import { createClientUpload, formatBytes, type UploadFileInput } from "@/lib/client-uploads";
import logo from "@/assets/bf-logo.png.asset.json";

export const Route = createFileRoute("/enviar")({
  component: EnviarPage,
  head: () => ({
    meta: [
      { title: "Enviar arquivos — BF Arte & Design" },
      { name: "description", content: "Envie fotos, artes e pastas completas para a BF Arte & Design personalizar seu produto." },
    ],
  }),
});

type Item = UploadFileInput & { id: string };

function toItems(fileList: FileList | null, useWebkitPath: boolean): Item[] {
  if (!fileList) return [];
  return Array.from(fileList).map((file) => {
    const anyFile = file as File & { webkitRelativePath?: string };
    const rel = useWebkitPath && anyFile.webkitRelativePath ? anyFile.webkitRelativePath : file.name;
    return { id: crypto.randomUUID(), file, relativePath: rel };
  });
}

function EnviarPage() {
  const filesInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [success, setSuccess] = useState(false);

  const totalBytes = items.reduce((s, i) => s + i.file.size, 0);

  const addFiles = (list: FileList | null, isFolder: boolean) => {
    const newItems = toItems(list, isFolder);
    setItems((prev) => {
      const seen = new Set(prev.map((p) => p.relativePath + ":" + p.file.size));
      const merged = [...prev];
      for (const n of newItems) {
        const key = n.relativePath + ":" + n.file.size;
        if (!seen.has(key)) {
          merged.push(n);
          seen.add(key);
        }
      }
      return merged;
    });
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) {
      toast.error("Informe seu nome.");
      return;
    }
    if (items.length === 0) {
      toast.error("Adicione ao menos um arquivo.");
      return;
    }
    setSending(true);
    setProgress({ done: 0, total: items.length });
    try {
      await createClientUpload({
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim() || undefined,
        senderPhone: senderPhone.trim() || undefined,
        note: note.trim() || undefined,
        files: items.map(({ file, relativePath }) => ({ file, relativePath })),
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setSuccess(true);
      setItems([]);
      setSenderName("");
      setSenderEmail("");
      setSenderPhone("");
      setNote("");
      toast.success("Envio concluído! Recebemos seus arquivos.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível concluir o envio. Tente novamente.");
    } finally {
      setSending(false);
      setProgress(null);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1">
          <div className="mx-auto max-w-2xl px-5 py-20 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
              Recebemos seus arquivos!
            </h1>
            <p className="mt-3 text-muted-foreground">
              Obrigado! Em breve entraremos em contato para dar continuidade ao seu projeto.
            </p>
            <Button className="mt-8 rounded-full" onClick={() => setSuccess(false)}>
              Fazer novo envio
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
          <div className="mb-8 flex items-center gap-3">
            <img src={logo.url} alt="BF Arte & Design" className="h-12 w-12 rounded-full object-contain" />
            <div>
              <h1 className="text-3xl font-semibold" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                Enviar arquivos
              </h1>
              <p className="text-sm text-muted-foreground">
                Compartilhe fotos, artes e até pastas completas para o seu pedido personalizado.
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-6 rounded-2xl border border-border/60 bg-background p-6 shadow-sm md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Seu nome *</Label>
                <Input id="name" required value={senderName} onChange={(e) => setSenderName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <Label htmlFor="phone">WhatsApp / telefone</Label>
                <Input id="phone" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} maxLength={30} placeholder="(00) 00000-0000" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} maxLength={255} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="note">Observações (opcional)</Label>
                <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Descreva seu projeto ou instruções para os arquivos." />
              </div>
            </div>

            <div className="rounded-xl border-2 border-dashed border-border/70 bg-muted/30 p-6 text-center">
              <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Escolha arquivos ou uma pasta inteira</p>
              <p className="text-xs text-muted-foreground">Pastas com subpastas são preservadas no envio.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button type="button" variant="outline" onClick={() => filesInputRef.current?.click()}>
                  <FileUp className="mr-2 h-4 w-4" /> Adicionar arquivos
                </Button>
                <Button type="button" variant="outline" onClick={() => folderInputRef.current?.click()}>
                  <FolderUp className="mr-2 h-4 w-4" /> Adicionar pasta
                </Button>
              </div>
              <input
                ref={filesInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files, false);
                  e.target.value = "";
                }}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                className="hidden"
                // @ts-expect-error non-standard directory attributes supported in Chromium/WebKit
                webkitdirectory=""
                directory=""
                onChange={(e) => {
                  addFiles(e.target.files, true);
                  e.target.value = "";
                }}
              />
            </div>

            {items.length > 0 && (
              <div className="rounded-xl border border-border/60">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-sm">
                  <span className="font-medium">{items.length} arquivo(s) — {formatBytes(totalBytes)}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setItems([])} disabled={sending}>
                    Limpar
                  </Button>
                </div>
                <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto text-sm">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between gap-3 px-4 py-2">
                      <span className="truncate" title={it.relativePath}>{it.relativePath}</span>
                      <span className="flex items-center gap-3">
                        <span className="whitespace-nowrap text-xs text-muted-foreground">{formatBytes(it.file.size)}</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                          onClick={() => removeItem(it.id)}
                          disabled={sending}
                          aria-label="Remover"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {progress && (
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                Enviando… {progress.done}/{progress.total}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full rounded-full" disabled={sending || items.length === 0}>
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" /> Enviar arquivos
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}