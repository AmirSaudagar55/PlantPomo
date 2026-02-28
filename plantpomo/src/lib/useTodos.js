/**
 * useTodos — Optimistic, local-first To-Do management.
 *
 * Architecture (mirrors useInventory.js):
 *  1. INSTANT FIRST PAINT — tasks are read from localStorage synchronously.
 *  2. BACKGROUND HYDRATION — Supabase fetch runs after mount and updates the cache.
 *  3. OPTIMISTIC MUTATIONS — add/toggle/delete update local state immediately (0 ms)
 *     and sync to Supabase in the background (fire-and-forget).
 *
 * No drag-and-drop dependency added to keep the bundle lean; reordering is
 * done via simple up/down buttons if needed later.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

const LS_PREFIX = "plantpomo:todos:v1:";

// ── localStorage helpers ──────────────────────────────────────────────────────
function readCache(userId) {
    if (!userId) return null;
    try {
        const raw = localStorage.getItem(LS_PREFIX + userId);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}
function writeCache(userId, todos) {
    if (!userId) return;
    try { localStorage.setItem(LS_PREFIX + userId, JSON.stringify(todos)); } catch { }
}

// ── Stable id generator (client-side only, replaced by DB id on save) ─────────
let _seq = 0;
function tempId() { return `tmp_${Date.now()}_${++_seq}`; }

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useTodos(userId) {
    // Seed from localStorage for 0-ms first paint
    const [todos, setTodos] = useState(() => readCache(userId) ?? []);
    const [loading, setLoading] = useState(!readCache(userId));

    // Keep a stable ref for use inside async callbacks without stale closures
    const todosRef = useRef(todos);
    useEffect(() => { todosRef.current = todos; }, [todos]);

    // Flush cache on every state change
    useEffect(() => { writeCache(userId, todos); }, [todos, userId]);

    // ── Fetch from Supabase once ────────────────────────────────────────────
    const fetchTodos = useCallback(async () => {
        if (!supabase || !userId) { setLoading(false); return; }

        const { data, error } = await supabase
            .from("todos")
            .select("id, title, is_completed, created_at, completed_at, completed_plant_id, priority, order_idx")
            .eq("user_id", userId)
            .order("order_idx", { ascending: true })
            .order("created_at", { ascending: true });

        if (error) { console.warn("[useTodos] fetch error:", error.message); setLoading(false); return; }

        const rows = data ?? [];
        setTodos(rows);
        writeCache(userId, rows);
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        if (userId) fetchTodos();
        else { setTodos([]); setLoading(false); }
    }, [userId, fetchTodos]);

    // ── addTask ────────────────────────────────────────────────────────────
    const addTask = useCallback((title, priority = 0) => {
        if (!userId) return;
        const trimmed = title.trim();
        if (!trimmed) return;

        // Compute order_idx as max + 1 for appending at the end
        const maxIdx = todosRef.current.reduce((m, t) => Math.max(m, t.order_idx ?? 0), 0);
        const optimistic = {
            id: tempId(),
            title: trimmed,
            is_completed: false,
            created_at: new Date().toISOString(),
            completed_at: null,
            completed_plant_id: null,
            priority,
            order_idx: maxIdx + 1,
            _saving: true,   // UI hint
        };

        setTodos(prev => [...prev, optimistic]);

        if (!supabase) return;

        supabase
            .from("todos")
            .insert({ user_id: userId, title: trimmed, priority, order_idx: maxIdx + 1 })
            .select("id, title, is_completed, created_at, completed_at, completed_plant_id, priority, order_idx")
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.warn("[useTodos] addTask error:", error.message);
                    // Roll back the optimistic row
                    setTodos(prev => prev.filter(t => t.id !== optimistic.id));
                    return;
                }
                // Replace temp row with real DB row
                setTodos(prev => prev.map(t => t.id === optimistic.id ? { ...data } : t));
            });
    }, [userId]);

    // ── toggleTask ─────────────────────────────────────────────────────────
    /**
     * @param {string}  id             – todo row id
     * @param {boolean} nowCompleted   – the NEW value (true = marking done)
     * @param {string|null} plantId    – currently selected plant in FocusCard
     */
    const toggleTask = useCallback((id, nowCompleted, plantId = null) => {
        if (!userId) return;

        const completedAt = nowCompleted ? new Date().toISOString() : null;
        const completedPlantId = nowCompleted ? (plantId ?? null) : null;

        // Optimistic update
        setTodos(prev => prev.map(t =>
            t.id === id
                ? { ...t, is_completed: nowCompleted, completed_at: completedAt, completed_plant_id: completedPlantId }
                : t
        ));

        if (!supabase) return;

        supabase
            .from("todos")
            .update({ is_completed: nowCompleted, completed_at: completedAt, completed_plant_id: completedPlantId })
            .eq("id", id)
            .eq("user_id", userId)
            .then(({ error }) => {
                if (error) {
                    console.warn("[useTodos] toggleTask error:", error.message);
                    // Roll back
                    setTodos(prev => prev.map(t =>
                        t.id === id ? { ...t, is_completed: !nowCompleted, completed_at: null, completed_plant_id: null } : t
                    ));
                }
            });
    }, [userId]);

    // ── updateTitle ────────────────────────────────────────────────────────
    const updateTitle = useCallback((id, newTitle) => {
        if (!userId) return;
        const trimmed = newTitle.trim();
        if (!trimmed) return;

        setTodos(prev => prev.map(t => t.id === id ? { ...t, title: trimmed } : t));

        if (!supabase) return;
        supabase
            .from("todos")
            .update({ title: trimmed })
            .eq("id", id)
            .eq("user_id", userId)
            .then(({ error }) => { if (error) console.warn("[useTodos] updateTitle error:", error.message); });
    }, [userId]);

    // ── setPriority ────────────────────────────────────────────────────────
    const setPriority = useCallback((id, priority) => {
        if (!userId) return;
        setTodos(prev => prev.map(t => t.id === id ? { ...t, priority } : t));
        if (!supabase) return;
        supabase.from("todos").update({ priority }).eq("id", id).eq("user_id", userId)
            .then(({ error }) => { if (error) console.warn("[useTodos] setPriority error:", error.message); });
    }, [userId]);

    // ── deleteTask ─────────────────────────────────────────────────────────
    const deleteTask = useCallback((id) => {
        if (!userId) return;
        const snapshot = todosRef.current.find(t => t.id === id);
        setTodos(prev => prev.filter(t => t.id !== id));

        if (!supabase) return;
        supabase
            .from("todos")
            .delete()
            .eq("id", id)
            .eq("user_id", userId)
            .then(({ error }) => {
                if (error) {
                    console.warn("[useTodos] deleteTask error:", error.message);
                    if (snapshot) setTodos(prev => [...prev, snapshot].sort((a, b) => a.order_idx - b.order_idx));
                }
            });
    }, [userId]);

    // ── clearCompleted ─────────────────────────────────────────────────────
    const clearCompleted = useCallback(() => {
        if (!userId) return;
        const completedIds = todosRef.current.filter(t => t.is_completed).map(t => t.id);
        if (!completedIds.length) return;
        setTodos(prev => prev.filter(t => !t.is_completed));
        if (!supabase) return;
        supabase.from("todos").delete().in("id", completedIds).eq("user_id", userId)
            .then(({ error }) => { if (error) console.warn("[useTodos] clearCompleted error:", error.message); });
    }, [userId]);

    // ── Derived counts ─────────────────────────────────────────────────────
    const total = todos.length;
    const completed = todos.filter(t => t.is_completed).length;

    return { todos, loading, total, completed, addTask, toggleTask, updateTitle, setPriority, deleteTask, clearCompleted, refetch: fetchTodos };
}
