import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  id: string;
  maintenance_mode: boolean;
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("id, maintenance_mode")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as SiteSettings) ?? { id: "", maintenance_mode: false };
}

export async function setMaintenanceMode(id: string, enabled: boolean) {
  const { error } = await supabase
    .from("site_settings")
    .update({ maintenance_mode: enabled })
    .eq("id", id);
  if (error) throw error;
}