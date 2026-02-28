import React, { useRef, useState, useCallback } from "react";
import {
    X, Plus, CheckCircle2, Circle, Trash2, Pencil, Check,
    ChevronDown, Flag, LayoutList, Sparkles,
} from "lucide-react";
import { useTodos } from "../lib/useTodos";
import { plants } from "./tilesData";

/* ── Priority config ──────────────────────────────────────────────────────── */
const PRIORITY = [
    { value: 0, label: "None", color: "text-white/30", bg: "bg-white/5", dot: "bg-white/20" },
    { value: 1, label: "Low", color: "text-sky-400", bg: "bg-sky-500/10", dot: "bg-sky-400" },
    { value: 2, label: "Medium", color: "text-amber-400", bg: "bg-amber-500/10", dot: "bg-amber-400" },
    { value: 3, label: "High", color: "text-red-400", bg: "bg-red-500/10", dot: "bg-red-400" },
];

/* ── Plant name/emoji lookup for the completion badge ────────────────────── */
function getPlantName(id) {
    return plants.find(p => p.id === id)?.name ?? id;
}
/* Tiny icon inline; fall back to a 🌱 */
function PlantBadge({ plantId }) {
    if (!plantId) return null;
    const plant = plants.find(p => p.id === plantId);
    return (
        <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/15 text-[9px] font-semibold text-emerald-300 shrink-0">
            {plant?.image
                ? <img src={plant.image} alt="" className="w-3 h-3 object-contain" />
                : "🌱"}
            {getPlantName(plantId)}
        </span>
    );
}

/* ── Individual task row ──────────────────────────────────────────────────── */
const TodoItem = ({ todo, onToggle, onDelete, onUpdateTitle, onSetPriority, activePlantId }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(todo.title);
    const [prioOpen, setPrioOpen] = useState(false);
    const inputRef = useRef(null);
    const pr = PRIORITY[todo.priority] ?? PRIORITY[0];

    const startEdit = () => {
        setDraft(todo.title);
        setEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };
    const commitEdit = () => {
        if (draft.trim() && draft.trim() !== todo.title) onUpdateTitle(todo.id, draft);
        setEditing(false);
    };

    return (
        <div
            className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all
                ${todo.is_completed
                    ? "border-white/[0.04] bg-white/[0.02]"
                    : "border-white/[0.06] bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]"
                }`}
        >
            {/* Priority dot */}
            <button
                onClick={() => setPrioOpen(o => !o)}
                className={`mt-[3px] w-2 h-2 rounded-full shrink-0 cursor-pointer transition-transform hover:scale-125 ${pr.dot}`}
                title={`Priority: ${pr.label}`}
            />

            {/* Checkbox */}
            <button
                onClick={() => onToggle(todo.id, !todo.is_completed, activePlantId)}
                className="mt-0.5 shrink-0 transition-all"
                aria-label={todo.is_completed ? "Mark incomplete" : "Mark complete"}
            >
                {todo.is_completed
                    ? <CheckCircle2 size={16} className="text-[#39ff14] drop-shadow-[0_0_4px_rgba(57,255,20,0.6)]" />
                    : <Circle size={16} className="text-white/25 group-hover:text-white/50 transition-colors" />
                }
            </button>

            {/* Title / Edit input */}
            <div className="flex-1 min-w-0">
                {editing ? (
                    <input
                        ref={inputRef}
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") setEditing(false);
                        }}
                        className="w-full bg-transparent text-sm text-white outline-none border-b border-[#39ff14]/40 pb-0.5"
                    />
                ) : (
                    <div className="flex flex-wrap items-center gap-1">
                        <span
                            className={`text-sm leading-snug break-words transition-all ${todo.is_completed ? "line-through text-white/30" : "text-white/80"}`}
                        >
                            {todo.title}
                        </span>
                        {todo.is_completed && <PlantBadge plantId={todo.completed_plant_id} />}
                    </div>
                )}

                {/* Priority picker dropdown */}
                {prioOpen && (
                    <div className="absolute left-0 mt-1 z-20 w-36 rounded-xl bg-[#0d1117]/96 border border-white/10 backdrop-blur-xl shadow-xl overflow-hidden top-full">
                        {PRIORITY.map(p => (
                            <button
                                key={p.value}
                                onClick={() => { onSetPriority(todo.id, p.value); setPrioOpen(false); }}
                                className={`flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors hover:bg-white/5 ${p.color}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                                {p.label}
                                {todo.priority === p.value && <Check size={10} className="ml-auto text-[#39ff14]" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Hover actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {!editing && !todo.is_completed && (
                    <button
                        onClick={startEdit}
                        className="p-1 rounded-md hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors"
                        title="Edit task"
                    >
                        <Pencil size={12} />
                    </button>
                )}
                <button
                    onClick={() => onDelete(todo.id)}
                    className="p-1 rounded-md hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors"
                    title="Delete task"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
};

/* ── Main panel ───────────────────────────────────────────────────────────── */
const TodoList = ({ open, onClose, userId, activePlantId }) => {
    const {
        todos, loading, total, completed,
        addTask, toggleTask, updateTitle, setPriority, deleteTask, clearCompleted,
    } = useTodos(userId);

    const [input, setInput] = useState("");
    const [priority, setPrio] = useState(0);
    const [showPrioSelect, setSPS] = useState(false);
    const [filter, setFilter] = useState("all"); // "all" | "active" | "done"
    const inputRef = useRef(null);

    const handleAdd = useCallback(() => {
        if (!input.trim()) return;
        addTask(input, priority);
        setInput("");
    }, [input, priority, addTask]);

    const pr = PRIORITY[priority] ?? PRIORITY[0];

    const visible = todos.filter(t => {
        if (filter === "active") return !t.is_completed;
        if (filter === "done") return t.is_completed;
        return true;
    });

    // Sort: incomplete first ordered by priority desc, then completed at bottom
    const sorted = [...visible].sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        return (b.priority - a.priority) || (a.order_idx - b.order_idx);
    });

    if (!open) return null;

    const progressPct = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className="fixed left-4 bottom-[72px] z-[56] w-[340px] max-h-[75vh] flex flex-col rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)]"
                onClick={e => e.stopPropagation()}
            >
                {/* Neon top glow strip */}
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#39ff14]/40 to-transparent" />

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex items-center gap-2 px-4 pt-4 pb-3 bg-[#07090e]/97 backdrop-blur-2xl shrink-0">
                    <LayoutList size={15} className="text-[#39ff14]" />
                    <span className="flex-1 text-sm font-bold text-white tracking-tight">Tasks</span>
                    <span className="text-[11px] text-white/35 tabular-nums">{completed}/{total}</span>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all"
                    >
                        <X size={12} />
                    </button>
                </div>

                {/* Progress bar */}
                {total > 0 && (
                    <div className="h-0.5 w-full bg-white/5 shrink-0">
                        <div
                            className="h-full bg-[#39ff14] transition-all duration-500 rounded-full shadow-[0_0_6px_rgba(57,255,20,0.5)]"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                )}

                {/* ── Filter tabs ─────────────────────────────────────────── */}
                <div className="flex gap-1 px-4 py-2 bg-[#07090e]/97 backdrop-blur-2xl shrink-0 border-b border-white/[0.05]">
                    {["all", "active", "done"].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-1 rounded-lg text-[10px] font-semibold capitalize transition-all ${filter === f
                                    ? "bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/20"
                                    : "text-white/30 hover:text-white/60"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* ── Task list ────────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto bg-[#07090e]/97 backdrop-blur-2xl px-3 py-2 flex flex-col gap-1.5 min-h-0 custom-scrollbar">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-5 h-5 border-2 border-[#39ff14]/30 border-t-[#39ff14] rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && sorted.length === 0 && (
                        <div className="flex flex-col items-center gap-3 py-10 text-center">
                            <Sparkles size={28} className="text-[#39ff14]/25" />
                            <p className="text-xs text-white/25 font-medium">
                                {filter === "done" ? "No completed tasks yet." : "No tasks yet. Add one below!"}
                            </p>
                        </div>
                    )}

                    {sorted.map(todo => (
                        <TodoItem
                            key={todo.id}
                            todo={todo}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onUpdateTitle={updateTitle}
                            onSetPriority={setPriority}
                            activePlantId={activePlantId}
                        />
                    ))}

                    {/* Clear completed shortcut */}
                    {completed > 0 && (
                        <button
                            onClick={clearCompleted}
                            className="mt-1 w-full text-[10px] text-white/25 hover:text-red-400 transition-colors py-1"
                        >
                            Clear {completed} completed task{completed > 1 ? "s" : ""}
                        </button>
                    )}
                </div>

                {/* ── Input row ────────────────────────────────────────────── */}
                <div className="shrink-0 px-3 pb-3 pt-2 bg-[#07090e]/97 backdrop-blur-2xl border-t border-white/[0.05]">
                    {/* Active plant context hint */}
                    {activePlantId && (
                        <div className="flex items-center gap-1.5 mb-2 px-1">
                            <span className="text-[9px] text-white/25">Completions will link to</span>
                            <PlantBadge plantId={activePlantId} />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {/* Priority picker mini-button */}
                        <div className="relative shrink-0">
                            <button
                                onClick={() => setSPS(o => !o)}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${pr.bg} border-white/10 ${pr.color}`}
                                title="Set priority"
                            >
                                <Flag size={10} />
                                <ChevronDown size={9} />
                            </button>
                            {showPrioSelect && (
                                <div className="absolute bottom-full mb-1 left-0 z-20 w-28 rounded-xl bg-[#0d1117]/96 border border-white/10 backdrop-blur-xl shadow-xl overflow-hidden">
                                    {PRIORITY.map(p => (
                                        <button
                                            key={p.value}
                                            onClick={() => { setPrio(p.value); setSPS(false); }}
                                            className={`flex items-center gap-2 w-full px-3 py-2 text-[10px] hover:bg-white/5 transition-colors ${p.color}`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                                            {p.label}
                                            {priority === p.value && <Check size={9} className="ml-auto text-[#39ff14]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
                            placeholder="What needs to be done?"
                            className="flex-1 h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-white/20 outline-none focus:border-[#39ff14]/30 transition-colors"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!input.trim()}
                            className="w-9 h-9 rounded-xl bg-[#39ff14]/15 border border-[#39ff14]/25 text-[#39ff14] hover:bg-[#39ff14]/25 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(57,255,20,0.06)]"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Scoped scrollbar style */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 9999px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
            `}</style>
        </>
    );
};

export default TodoList;
