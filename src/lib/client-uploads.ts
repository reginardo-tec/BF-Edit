import { supabase } from "@/integrations/supabase/client";

const BUCKET = "client-uploads";

export type UploadFileInput = {
  file: File;
  relativePath: string; // includes subfolders, e.g. "fotos/2024/img.jpg"
};

export type CreateUploadInput = {
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  note?: string;
  files: UploadFileInput[];
  onProgress?: (done: number, total: number) => void;
};

export async function createClientUpload(input: CreateUploadInput): Promise<string> {
  if (input.files.length === 0) throw new Error("Selecione ao menos um arquivo.");

  const totalBytes = input.files.reduce((s, f) => s + f.file.size, 0);

  const { data: submission, error: subErr } = await supabase
    .from("client_uploads")
    .insert({
      sender_name: input.senderName,
      sender_email: input.senderEmail || null,
      sender_phone: input.senderPhone || null,
      note: input.note || null,
      total_files: input.files.length,
      total_bytes: totalBytes,
    })
    .select("id")
    .single();
  if (subErr || !submission) throw subErr ?? new Error("Falha ao criar envio");

  const uploadId = submission.id;
  const rows: {
    upload_id: string;
    relative_path: string;
    storage_path: string;
    size_bytes: number;
    mime_type: string | null;
  }[] = [];

  let done = 0;
  for (const item of input.files) {
    const safeRel = item.relativePath.replace(/^\/+/, "");
    const storagePath = `${uploadId}/${safeRel}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, item.file, {
      cacheControl: "3600",
      upsert: false,
      contentType: item.file.type || undefined,
    });
    if (upErr) throw upErr;
    rows.push({
      upload_id: uploadId,
      relative_path: safeRel,
      storage_path: storagePath,
      size_bytes: item.file.size,
      mime_type: item.file.type || null,
    });
    done += 1;
    input.onProgress?.(done, input.files.length);
  }

  const { error: filesErr } = await supabase.from("client_upload_files").insert(rows);
  if (filesErr) throw filesErr;

  return uploadId;
}

export type ClientUploadSummary = {
  id: string;
  sender_name: string;
  sender_email: string | null;
  sender_phone: string | null;
  note: string | null;
  total_files: number;
  total_bytes: number;
  created_at: string;
};

export type ClientUploadFile = {
  id: string;
  upload_id: string;
  relative_path: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string | null;
};

export async function fetchClientUploads(): Promise<ClientUploadSummary[]> {
  const { data, error } = await supabase
    .from("client_uploads")
    .select("id, sender_name, sender_email, sender_phone, note, total_files, total_bytes, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClientUploadSummary[];
}

export async function fetchClientUploadFiles(uploadId: string): Promise<ClientUploadFile[]> {
  const { data, error } = await supabase
    .from("client_upload_files")
    .select("id, upload_id, relative_path, storage_path, size_bytes, mime_type")
    .eq("upload_id", uploadId)
    .order("relative_path", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ClientUploadFile[];
}

export async function downloadUploadFile(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) throw error ?? new Error("Falha ao baixar arquivo");
  return data;
}

export async function deleteClientUpload(uploadId: string, files: ClientUploadFile[]): Promise<void> {
  if (files.length > 0) {
    await supabase.storage.from(BUCKET).remove(files.map((f) => f.storage_path));
  }
  const { error } = await supabase.from("client_uploads").delete().eq("id", uploadId);
  if (error) throw error;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}