import { supabase } from "@/integrations/supabase/client";
import * as tus from "tus-js-client";

const BUCKET = "client-uploads";
const RESUMABLE_CHUNK_SIZE = 6 * 1024 * 1024;
const MAX_STORAGE_SEGMENT_LENGTH = 120;
const MAX_STORAGE_RELATIVE_PATH_LENGTH = 900;

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

  const uploadId = crypto.randomUUID();

  // Insert the submission row FIRST so the admin panel can see the upload
  // even if some files fail midway. Files are then registered incrementally.
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id ?? null;
  const { error: subErr } = await supabase.from("client_uploads").insert({
    id: uploadId,
    user_id: userId,
    sender_name: input.senderName,
    sender_email: input.senderEmail || null,
    sender_phone: input.senderPhone || null,
    note: input.note || null,
    total_files: input.files.length,
    total_bytes: totalBytes,
  });
  if (subErr) throw subErr;

  let done = 0;
  const usedStoragePaths = new Set<string>();
  for (const item of input.files) {
    const displayRel = normalizeDisplayPath(item.relativePath);
    const storageRel = makeUniqueStoragePath(sanitizeStorageRelativePath(displayRel), usedStoragePaths);
    usedStoragePaths.add(storageRel);
    const storagePath = `${uploadId}/${storageRel}`;
    await uploadResumable(item.file, storagePath);
    const { error: fileErr } = await supabase.from("client_upload_files").insert({
      upload_id: uploadId,
      relative_path: displayRel,
      storage_path: storagePath,
      size_bytes: item.file.size,
      mime_type: item.file.type || null,
    });
    if (fileErr) throw fileErr;
    done += 1;
    input.onProgress?.(done, input.files.length);
  }

  return uploadId;
}

function normalizeDisplayPath(path: string) {
  const normalized = path
    .replace(/\\/g, "/")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/^\/+/, "")
    .trim();

  return (normalized || "arquivo").slice(0, 1024);
}

function sanitizeStorageRelativePath(path: string) {
  const rawSegments = path.split("/").filter(Boolean);
  const segments = (rawSegments.length > 0 ? rawSegments : ["arquivo"]).map((segment, index) =>
    sanitizeStorageSegment(segment, index),
  );

  let sanitized = segments.join("/");
  if (sanitized.length > MAX_STORAGE_RELATIVE_PATH_LENGTH) {
    const fileName = segments.at(-1) ?? "arquivo";
    const folders = segments.slice(0, -1).map((segment) => clampSegment(segment, 36));
    sanitized = [...folders, clampSegment(fileName, 160)].join("/");
  }

  if (sanitized.length > MAX_STORAGE_RELATIVE_PATH_LENGTH) {
    const fileName = segments.at(-1) ?? "arquivo";
    sanitized = `${crypto.randomUUID().slice(0, 8)}/${clampSegment(fileName, 160)}`;
  }

  return sanitized;
}

function sanitizeStorageSegment(segment: string, index: number) {
  const withoutAccents = segment.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const safe = withoutAccents
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[^A-Za-z0-9._() -]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .replace(/^[ .-]+|[ .-]+$/g, "");

  const fallback = index === 0 ? "arquivo" : `item-${index + 1}`;
  const finalSegment = !safe || safe === "." || safe === ".." ? fallback : safe;
  return clampSegment(finalSegment, MAX_STORAGE_SEGMENT_LENGTH);
}

function clampSegment(segment: string, maxLength: number) {
  if (segment.length <= maxLength) return segment;

  const dot = segment.lastIndexOf(".");
  const hasExtension = dot > 0 && dot < segment.length - 1;
  if (!hasExtension) return segment.slice(0, maxLength).replace(/[ .-]+$/g, "") || "arquivo";

  const extension = segment.slice(dot, Math.min(segment.length, dot + 16));
  const base = segment.slice(0, Math.max(1, maxLength - extension.length));
  return `${base.replace(/[ .-]+$/g, "")}${extension}`;
}

function makeUniqueStoragePath(path: string, used: Set<string>) {
  if (!used.has(path)) return path;

  const slash = path.lastIndexOf("/");
  const dir = slash >= 0 ? `${path.slice(0, slash)}/` : "";
  const fileName = slash >= 0 ? path.slice(slash + 1) : path;
  const dot = fileName.lastIndexOf(".");
  const hasExtension = dot > 0 && dot < fileName.length - 1;
  const base = hasExtension ? fileName.slice(0, dot) : fileName;
  const extension = hasExtension ? fileName.slice(dot) : "";

  let counter = 2;
  let candidate = `${dir}${clampSegment(`${base}-${counter}`, MAX_STORAGE_SEGMENT_LENGTH - extension.length)}${extension}`;
  while (used.has(candidate)) {
    counter += 1;
    candidate = `${dir}${clampSegment(`${base}-${counter}`, MAX_STORAGE_SEGMENT_LENGTH - extension.length)}${extension}`;
  }
  return candidate;
}

function getSupabaseConfig() {
  const env = import.meta.env as Record<string, string | undefined>;
  const fallbackEnv = typeof process !== "undefined" ? process.env : undefined;
  const url = env.VITE_SUPABASE_URL ?? fallbackEnv?.SUPABASE_URL;
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? fallbackEnv?.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Configuração de upload indisponível. Tente novamente em instantes.");
  }

  return { url, publishableKey };
}

function isJwt(value: string) {
  return value.split(".").length === 3;
}

async function uploadResumable(file: File, storagePath: string): Promise<void> {
  const { url, publishableKey } = getSupabaseConfig();
  const { data } = await supabase.auth.getSession();
  const bearer = data.session?.access_token ?? (isJwt(publishableKey) ? publishableKey : undefined);
  const headers: Record<string, string> = {
    apikey: publishableKey,
    "x-upsert": "false",
  };

  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${url}/storage/v1/upload/resumable`,
      chunkSize: RESUMABLE_CHUNK_SIZE,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      removeFingerprintOnSuccess: true,
      uploadDataDuringCreation: true,
      fingerprint: () => Promise.resolve(`${BUCKET}/${storagePath}/${file.name}/${file.size}/${file.lastModified}`),
      headers,
      metadata: {
        bucketName: BUCKET,
        objectName: storagePath,
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
      },
      onError: (error) => reject(error),
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) upload.resumeFromPreviousUpload(previousUploads[0]);
      upload.start();
    }).catch(() => upload.start());
  });
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