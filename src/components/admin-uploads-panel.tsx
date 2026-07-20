import { Fragment, useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Trash2, ChevronDown, ChevronRight, Loader2, Inbox, FileDown } from "lucide-react";
import { toast } from "sonner";
import {
  deleteClientUpload,
  downloadUploadFile,
  fetchClientUploadFiles,
  fetchClientUploads,
  formatBytes,
  type ClientUploadFile,
  type ClientUploadSummary,
} from "@/lib/client-uploads";

export function AdminUploadsPanel() {
  const [uploads, setUploads] = useState<ClientUploadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filesById, setFilesById] = useState<Record<string, ClientUploadFile[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setUploads(await fetchClientUploads());
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível carregar os envios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const ensureFiles = async (uploadId: string) => {
    if (filesById[uploadId]) return filesById[uploadId];
    const files = await fetchClientUploadFiles(uploadId);
    setFilesById((prev) => ({ ...prev, [uploadId]: files }));
    return files;
  };

  const toggleExpand = async (uploadId: string) => {
    if (expanded === uploadId) {
      setExpanded(null);
      return;
    }
    setExpanded(uploadId);
    try {
      await ensureFiles(uploadId);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível carregar os arquivos deste envio.");
    }
  };

  const downloadOne = async (file: ClientUploadFile) => {
    try {
      const blob = await downloadUploadFile(file.storage_path);
      const name = file.relative_path.split("/").pop() ?? "arquivo";
      saveAs(blob, name);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao baixar o arquivo.");
    }
  };

  const downloadZip = async (upload: ClientUploadSummary) => {
    setBusyId(upload.id);
    try {
      const files = await ensureFiles(upload.id);
      if (files.length === 0) {
        toast.info("Envio sem arquivos.");
        return;
      }
      const zip = new JSZip();
      for (const f of files) {
        const blob = await downloadUploadFile(f.storage_path);
        zip.file(f.relative_path, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const safeName = upload.sender_name.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "envio";
      const stamp = new Date(upload.created_at).toISOString().slice(0, 10);
      saveAs(out, `${stamp}_${safeName}.zip`);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao gerar o ZIP.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (upload: ClientUploadSummary) => {
    if (!confirm(`Excluir o envio de "${upload.sender_name}" e todos os arquivos?`)) return;
    setBusyId(upload.id);
    try {
      const files = await ensureFiles(upload.id);
      await deleteClientUpload(upload.id, files);
      setUploads((prev) => prev.filter((u) => u.id !== upload.id));
      setFilesById((prev) => {
        const next = { ...prev };
        delete next[upload.id];
        return next;
      });
      toast.success("Envio excluído.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível excluir.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-muted-foreground">Carregando envios...</div>;
  }

  if (uploads.length === 0) {
    return (
      <div className="p-16 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Nenhum arquivo recebido ainda.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Compartilhe o link <span className="font-mono">/enviar</span> com seus clientes.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Remetente</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Data</TableHead>
          <TableHead className="text-right">Arquivos</TableHead>
          <TableHead className="text-right">Tamanho</TableHead>
          <TableHead className="w-56 text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {uploads.map((u) => {
          const isOpen = expanded === u.id;
          const files = filesById[u.id] ?? [];
          const busy = busyId === u.id;
          return (
            <Fragment key={u.id}>
              <TableRow>
                <TableCell>
                  <button onClick={() => toggleExpand(u.id)} aria-label="Expandir" className="text-muted-foreground">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{u.sender_name}</div>
                  {u.note && <div className="text-xs text-muted-foreground line-clamp-2 max-w-xs">{u.note}</div>}
                </TableCell>
                <TableCell className="text-xs">
                  {u.sender_email && <div>{u.sender_email}</div>}
                  {u.sender_phone && <div className="text-muted-foreground">{u.sender_phone}</div>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleString("pt-BR")}
                </TableCell>
                <TableCell className="text-right">{u.total_files}</TableCell>
                <TableCell className="text-right">{formatBytes(u.total_bytes)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => downloadZip(u)} disabled={busy}>
                      {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
                      ZIP
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(u)} disabled={busy} aria-label="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {isOpen && (
                <TableRow key={`${u.id}-files`} className="bg-muted/30 hover:bg-muted/30">
                  <TableCell />
                  <TableCell colSpan={6} className="py-3">
                    {files.length === 0 ? (
                      <div className="text-xs text-muted-foreground">Carregando arquivos…</div>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {files.map((f) => (
                          <li key={f.id} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-1.5">
                            <span className="truncate font-mono text-xs" title={f.relative_path}>{f.relative_path}</span>
                            <span className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">{formatBytes(f.size_bytes)}</span>
                              <button onClick={() => downloadOne(f)} className="text-primary hover:text-primary/80" aria-label="Baixar">
                                <FileDown className="h-4 w-4" />
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}