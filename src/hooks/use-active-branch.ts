"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

export type BranchOption = {
  id: string;
  name: string;
};

export function useActiveBranch() {
  const { appUser, staffMember } = useAuth();
  const ownerId = (staffMember as any)?.owner_id || (appUser as any)?.id || null;

  const storageKey = useMemo(() => (ownerId ? `activeBranch:${ownerId}` : "activeBranch"), [ownerId]);

  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const isReadonly = !!(staffMember as any)?.branch_id; // staff bound to one branch
  const staffBranchId = (staffMember as any)?.branch_id || null;

  useEffect(() => {
    if (!ownerId) return;
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
    if (saved) setActiveBranchId(saved);
  }, [ownerId, storageKey]);

  const loadBranches = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("branches")
        .select("id, name")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error loading branches:", error);
        setBranches([]);
        return;
      }
      const opts = (data || []).map((b: any) => ({ id: b.id, name: b.name }));
      setBranches(opts);
      if (!isReadonly) {
        const saved = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
        if (saved && opts.find((b: BranchOption) => b.id === saved)) {
          setActiveBranchId(saved);
        } else if (opts.length > 0) {
          setActiveBranchId(opts[0].id);
          if (typeof window !== "undefined") window.localStorage.setItem(storageKey, opts[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [ownerId, isReadonly, storageKey]);

  useEffect(() => {
    if (!ownerId) return;
    if (isReadonly && staffBranchId) {
      setActiveBranchId(staffBranchId);
      return;
    }
    loadBranches();
  }, [ownerId, isReadonly, staffBranchId, loadBranches]);

  const updateActive = (id: string) => {
    setActiveBranchId(id);
    if (typeof window !== "undefined") window.localStorage.setItem(storageKey, id);
  };

  return {
    ownerId,
    branches,
    activeBranchId,
    setActiveBranchId: updateActive,
    isReadonly,
    reload: loadBranches,
    loading,
  };
}
