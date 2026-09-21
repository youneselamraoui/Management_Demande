import { useState, useEffect, useRef, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const MONTHS_EN = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const WEEKDAYS = ["Mo","Tu","We","Th","Fr","Sa","Su"];

function isoToFr(iso) {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${m}/${d}/${y}`;
}
function frToIso(val) {
  const p = val.trim().split("/");
  if (p.length !== 3) return null;
  let [m,d,y] = p;
  if (y.length === 2) y = "20"+y;
  if (y.length !== 4) return null;
  const iso = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  const dt = new Date(iso+"T12:00:00");
  if (isNaN(dt.getTime())) return null;
  // validate round-trip to avoid 31/02
  if (dt.getUTCDate() !== Number(d) || dt.getUTCMonth()+1 !== Number(m)) return null;
  return iso;
}
function getMonthMatrix(year, month) {
  // month 0-11, monday start
  const first = new Date(year, month, 1);
  let startDay = first.getDay(); // 0=dimanche
  startDay = startDay === 0 ? 6 : startDay - 1; // 0=lundi
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = startDay - 1; i >= 0; i--) cells.push({ d: daysInPrev - i, other: true, month: month - 1 });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, other: false, month });
  // fill to 6 rows (42 cells) like screenshot
  while (cells.length < 42) {
    const extra = cells.length - (startDay + daysInMonth) + 1;
    cells.push({ d: extra, other: true, month: month + 1 });
  }
  return cells;
}

export default function DatePicker({ value, onChange, placeholder = "mm/dd/yyyy" }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => isoToFr(value));
  const [viewYear, setViewYear] = useState(() => {
    if (value) return Number(value.split("-")[0]);
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return Number(value.split("-")[1]) - 1;
    return new Date().getMonth();
  });

  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setText(isoToFr(value)); }, [value]);
  useEffect(() => {
    if (value) {
      setViewYear(Number(value.split("-")[0]));
      setViewMonth(Number(value.split("-")[1]) - 1);
    }
  }, [value]);

  // close on outside click / esc
  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); }
  }, [open]);

  const todayIso = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
  }, []);

  const cells = useMemo(() => getMonthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);

  function commitText(v) {
    if (!v.trim()) { onChange(""); setOpen(false); return; }
    const iso = frToIso(v);
    if (iso) {
      onChange(iso);
      setText(isoToFr(iso));
      setOpen(false);
    }
  }
  function pickDay(cell) {
    let y = viewYear, m = cell.month;
    // handle year overflow
    if (m < 0) { y -= 1; m = 11; }
    else if (m > 11) { y += 1; m = 0; }
    else m = viewMonth;
    // correct for prev/next month cells
    if (cell.other) {
      if (cell.month === viewMonth - 1 || (viewMonth === 0 && cell.month === -1)) {
        m = viewMonth - 1; if (m < 0) { m = 11; y = viewYear - 1; }
      } else {
        m = viewMonth + 1; if (m > 11) { m = 0; y = viewYear + 1; }
      }
    }
    const iso = `${y}-${String(m+1).padStart(2,"0")}-${String(cell.d).padStart(2,"0")}`;
    onChange(iso);
    setText(isoToFr(iso));
    setOpen(false);
  }

  function go(delta) {
    let nm = viewMonth + delta;
    let ny = viewYear;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    setViewMonth(nm); setViewYear(ny);
  }

  const selectedDay = value ? Number(value.split("-")[2]) : null;
  const selectedMonth = value ? Number(value.split("-")[1])-1 : null;
  const selectedYear = value ? Number(value.split("-")[0]) : null;

  return (
    <div ref={rootRef} className="relative">
      {/* Input – design web aligné avec theme.css */}
      <div className={`flex items-center gap-1.5 rounded-xl border bg-card px-2.5 py-1.5 transition ${open ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"} ${value ? "bg-accent/40" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9/]/g, "");
            setText(v);
            // auto sync if complete
            if (v.length === 10) {
              const iso = frToIso(v);
              if (iso) onChange(iso);
            } else if (v === "") {
              onChange("");
            }
          }}
          onBlur={() => commitText(text)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter") commitText(text); }}
          className="w-[92px] bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none"
        />
        {value ? (
          <button
            type="button"
            onClick={() => { onChange(""); setText(""); inputRef.current?.focus(); }}
            className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Clear"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`grid size-7 place-items-center rounded-lg border transition ${open ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
        >
          <Calendar className="size-3.5" />
        </button>
      </div>

      {/* Calendar popup */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[300px] rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] animate-in fade-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-bold capitalize text-foreground hover:bg-muted"
              onClick={() => {
                // quick month picker – cycle for now
              }}
            >
              {MONTHS_EN[viewMonth]} {viewYear}
              <ChevronRight className="size-3 rotate-90 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => go(-1)} className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                <ChevronLeft className="size-4" />
              </button>
              <button type="button" onClick={() => go(1)} className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Année shortcut */}
          <div className="mt-2 flex gap-1.5">
            {[viewYear - 1, viewYear, viewYear + 1].map((y) => (
              <button
                key={y}
                onClick={() => setViewYear(y)}
                className={`flex-1 rounded-full px-2 py-1 text-xs font-semibold ${y === viewYear ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
              >
                {y}
              </button>
            ))}
          </div>

          {/* Weekdays */}
          <div className="mt-3 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="grid size-8 place-items-center text-xs font-semibold text-muted-foreground">{w}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, idx) => {
              const isOther = c.other;
              // compute iso for this cell to compare
              let cy = viewYear, cm = viewMonth;
              if (isOther) {
                const pos = idx < 7 && c.d > 20 ? -1 : idx >= 35 && c.d < 15 ? 1 : 0;
                // more robust: infer from index
                if (idx < 7 && c.d > 15) { cm = viewMonth - 1; if (cm < 0) { cm = 11; cy--; } }
                else if (c.d < 15 && idx > 27) { cm = viewMonth + 1; if (cm > 11) { cm = 0; cy++; } }
              }
              const iso = `${cy}-${String(cm+1).padStart(2,"0")}-${String(c.d).padStart(2,"0")}`;
              const isToday = iso === todayIso;
              const isSelected = value && !isOther ? (c.d === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear) : (iso === value);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => pickDay(c)}
                  className={`grid size-8 place-items-center rounded-lg text-sm transition
                    ${isSelected ? "bg-primary font-bold text-primary-foreground shadow-sm hover:bg-primary/90" : ""}
                    ${!isSelected && isToday ? "ring-1 ring-primary font-semibold text-primary" : ""}
                    ${!isSelected && !isToday && !isOther ? "font-medium text-foreground hover:bg-accent hover:text-accent-foreground" : ""}
                    ${isOther && !isSelected ? "font-normal text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground" : ""}
                  `}
                >
                  {c.d}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={() => { onChange(""); setText(""); setOpen(false); }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(todayIso);
                setText(isoToFr(todayIso));
                setViewYear(Number(todayIso.split("-")[0]));
                setViewMonth(Number(todayIso.split("-")[1]) - 1);
                setOpen(false);
              }}
              className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
