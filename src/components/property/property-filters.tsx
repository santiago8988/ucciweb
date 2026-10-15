"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { X, Check, Search, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from "@/lib/constants";

// URL param keys — kept short and stable for shareable URLs.
const PARAM = {
  op: "op",
  tipo: "tipo",
  loc: "loc",
  bar: "bar",
  mon: "mon",
  pmin: "pmin",
  pmax: "pmax",
  amb: "amb",
  dorm: "dorm",
  antmin: "antmin",
  antmax: "antmax",
  cmin: "cmin",
  cmax: "cmax",
  tmin: "tmin",
  tmax: "tmax",
  q: "q",
  vendidas: "vendidas",
} as const;

// Single choice: "Todas" clears the param.
const OPERATION_OPTIONS = [
  { value: null, label: "Todas" },
  { value: "venta", label: "Venta" },
  { value: "alquiler", label: "Alquiler" },
] as const;

// Without a currency the price range is ignored (ARS and USD amounts aren't comparable).
const CURRENCY_OPTIONS = [
  { value: null, label: "Cualquiera" },
  { value: "ARS", label: "ARS" },
  { value: "USD", label: "USD" },
] as const;

const TYPE_OPTIONS = PROPERTY_TYPES.map((value) => ({
  value,
  label: PROPERTY_TYPE_LABELS[value],
}));

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function PropertyFilters({
  localities,
  neighborhoods,
  showTitle = true,
  onPendingChange,
}: {
  localities: string[];
  neighborhoods: string[];
  /** The mobile sheet already has its own title. */
  showTitle?: boolean;
  /** Lets the mobile sheet show "Actualizando…" while results reload. */
  onPendingChange?: (pending: boolean) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  // Optimistic URL query string — updated immediately on click so chips reflect
  // the new selection before the server finishes re-rendering the list.
  const urlString = searchParams.toString();
  const [optimisticString, setOptimisticString] = useOptimistic(
    urlString,
    (_: string, next: string) => next
  );
  const optimisticParams = useMemo(
    () => new URLSearchParams(optimisticString),
    [optimisticString]
  );

  // Snapshot values from optimistic URL.
  const op = optimisticParams.get(PARAM.op);
  const tipos = parseList(optimisticParams.get(PARAM.tipo));
  const locs = parseList(optimisticParams.get(PARAM.loc));
  const bars = parseList(optimisticParams.get(PARAM.bar));
  const currency = optimisticParams.get(PARAM.mon);
  const amb = optimisticParams.get(PARAM.amb);
  const dorm = optimisticParams.get(PARAM.dorm);

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(optimisticString);
      mutate(params);
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        setOptimisticString(qs);
        router.replace(qs ? `/propiedades?${qs}` : "/propiedades", { scroll: false });
      });
    },
    [router, optimisticString, setOptimisticString]
  );

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      commit((params) => {
        const current = parseList(params.get(key));
        const idx = current.indexOf(value);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(value);
        if (current.length === 0) params.delete(key);
        else params.set(key, current.join(","));
      });
    },
    [commit]
  );

  const setSingle = useCallback(
    (key: string, value: string | null) => {
      commit((params) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      });
    },
    [commit]
  );

  const clearAll = () => {
    startTransition(() => {
      setOptimisticString("");
      router.replace("/propiedades", { scroll: false });
    });
  };

  const hasAnyFilter = useMemo(() => {
    for (const key of Object.values(PARAM)) {
      if (optimisticParams.get(key)) return true;
    }
    return false;
  }, [optimisticParams]);

  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          "flex items-center px-1 pb-3",
          showTitle ? "justify-between" : "justify-end"
        )}
      >
        {showTitle && (
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink inline-flex items-center gap-2">
            Filtros
            {isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-dark" />
            )}
          </h2>
        )}
        {hasAnyFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-medium uppercase tracking-wider text-ink/70 hover:text-ink transition-colors inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* Operación */}
      <FilterSection title="Tipo de Operación">
        <ChipRow>
          {OPERATION_OPTIONS.map((opt) => (
            <Chip
              key={opt.label}
              active={op === opt.value}
              onClick={() => setSingle(PARAM.op, opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </ChipRow>
      </FilterSection>

      {/* Localización */}
      <FilterSection title="Localización">
        <LocalityPicker
          localities={localities}
          selected={locs}
          onToggle={(value) => toggleMulti(PARAM.loc, value)}
        />
      </FilterSection>

      {/* Barrio */}
      {neighborhoods.length > 0 && (
        <FilterSection title="Barrio">
          <SearchFirstPicker
            options={neighborhoods}
            selected={bars}
            onToggle={(value) => toggleMulti(PARAM.bar, value)}
          />
        </FilterSection>
      )}

      {/* Tipo */}
      <FilterSection title="Tipo">
        <ChipRow>
          {TYPE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              active={tipos.includes(opt.value)}
              onClick={() => toggleMulti(PARAM.tipo, opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </ChipRow>
      </FilterSection>

      {/* Rango de precio */}
      <FilterSection title="Rango de precio">
        <div className="flex items-center gap-1 mb-3" role="group" aria-label="Moneda">
          {CURRENCY_OPTIONS.map((cur) => (
            <button
              key={cur.label}
              type="button"
              aria-pressed={currency === cur.value}
              onClick={() =>
                commit((params) => {
                  if (cur.value) params.set(PARAM.mon, cur.value);
                  else {
                    params.delete(PARAM.mon);
                    params.delete(PARAM.pmin);
                    params.delete(PARAM.pmax);
                  }
                })
              }
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                currency === cur.value
                  ? "border-brand bg-brand text-black"
                  : "border-ink/15 bg-white text-ink/70 hover:border-ink/30"
              )}
            >
              {cur.label}
            </button>
          ))}
        </div>
        {currency ? (
          <DebouncedRange
            minKey={PARAM.pmin}
            maxKey={PARAM.pmax}
            placeholderMin={`Desde ${currency}`}
            placeholderMax={`Hasta ${currency}`}
            label="Precio"
            commit={commit}
          />
        ) : (
          <p className="text-xs text-ink/70">Elegí la moneda para filtrar por precio.</p>
        )}
      </FilterSection>

      {/* Ambientes */}
      <FilterSection title="Ambientes">
        <NumericChips
          value={amb ? Number(amb) : null}
          max={5}
          onChange={(v) => setSingle(PARAM.amb, v == null ? null : String(v))}
        />
      </FilterSection>

      {/* Dormitorios */}
      <FilterSection title="Dormitorios">
        <NumericChips
          value={dorm ? Number(dorm) : null}
          max={4}
          onChange={(v) => setSingle(PARAM.dorm, v == null ? null : String(v))}
        />
      </FilterSection>

      {/* Antigüedad */}
      <FilterSection title="Antigüedad (años)">
        <DebouncedRange
          minKey={PARAM.antmin}
          label="Antigüedad en años"
          maxKey={PARAM.antmax}
          placeholderMin="Desde"
          placeholderMax="Hasta"
          commit={commit}
        />
      </FilterSection>

      {/* Superficie cubierta */}
      <FilterSection title="Superficie cubierta (m²)">
        <DebouncedRange
          minKey={PARAM.cmin}
          label="Superficie cubierta en m²"
          maxKey={PARAM.cmax}
          placeholderMin="Mín."
          placeholderMax="Máx."
          commit={commit}
        />
      </FilterSection>

      {/* Superficie total */}
      <FilterSection title="Superficie total (m²)">
        <DebouncedRange
          minKey={PARAM.tmin}
          label="Superficie total en m²"
          maxKey={PARAM.tmax}
          placeholderMin="Mín."
          placeholderMax="Máx."
          commit={commit}
        />
      </FilterSection>

      {/* Estado — sold listings are hidden unless asked for */}
      <FilterSection title="Estado">
        <ChipRow>
          <Chip
            active={optimisticParams.get(PARAM.vendidas) === "1"}
            onClick={() =>
              setSingle(PARAM.vendidas, optimisticParams.get(PARAM.vendidas) === "1" ? null : "1")
            }
          >
            Ver vendidas
          </Chip>
        </ChipRow>
      </FilterSection>

      {/* Características (free text) */}
      <FilterSection title="Características" defaultOpen={false}>
        <DebouncedText
          paramKey={PARAM.q}
          placeholder="pileta, parrilla, cochera..."
          commit={commit}
        />
      </FilterSection>
    </div>
  );
}

// ---------- building blocks ----------

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ink/10 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 px-1 text-left"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-ink">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-ink/50 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="pb-4 px-1">{children}</div>}
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
        active
          ? "border-brand bg-brand text-black"
          : "border-ink/15 bg-white text-ink/70 hover:border-ink/40 hover:text-ink"
      )}
    >
      {active && <Check className="h-3 w-3" />}
      {children}
    </button>
  );
}

function NumericChips({
  value,
  max,
  onChange,
}: {
  value: number | null;
  max: number;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
        // The filter is a minimum ("3" means 3 or more), so every label says so.
        const label = `${n}+`;
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : n)}
            className={cn(
              "h-8 min-w-10 rounded-md border px-2 text-sm font-medium transition-all",
              active
                ? "border-brand bg-brand text-black"
                : "border-ink/15 bg-white text-ink/70 hover:border-ink/40 hover:text-ink"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function DebouncedRange({
  minKey,
  maxKey,
  placeholderMin,
  placeholderMax,
  label,
  commit,
}: {
  minKey: string;
  maxKey: string;
  placeholderMin: string;
  placeholderMax: string;
  label: string;
  commit: (mutate: (params: URLSearchParams) => void) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <DebouncedNumberInput
        paramKey={minKey}
        placeholder={placeholderMin}
        label={`${label} mínimo`}
        commit={commit}
      />
      <span className="text-ink/30" aria-hidden>—</span>
      <DebouncedNumberInput
        paramKey={maxKey}
        placeholder={placeholderMax}
        label={`${label} máximo`}
        commit={commit}
      />
    </div>
  );
}

// Local input state that follows the URL when it changes from elsewhere
// (e.g. "Limpiar"), adjusted during render instead of in an effect. Our own
// debounced commit marks its value as synced so the URL echo doesn't clobber
// what the user kept typing meanwhile.
function useUrlSyncedValue(urlValue: string) {
  const [value, setValue] = useState(urlValue);
  const [syncedUrl, setSyncedUrl] = useState(urlValue);
  if (urlValue !== syncedUrl) {
    setSyncedUrl(urlValue);
    setValue(urlValue);
  }
  return { value, setValue, markSynced: setSyncedUrl };
}

function useDebouncedCommit(
  paramKey: string,
  commit: (mutate: (params: URLSearchParams) => void) => void,
  markSynced: (value: string) => void,
  delay: number
) {
  const timeoutRef = useRef<number | null>(null);
  return (next: string) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      markSynced(next);
      commit((params) => {
        if (next) params.set(paramKey, next);
        else params.delete(paramKey);
      });
    }, delay);
  };
}

function DebouncedNumberInput({
  paramKey,
  placeholder,
  label,
  commit,
}: {
  paramKey: string;
  placeholder: string;
  label: string;
  commit: (mutate: (params: URLSearchParams) => void) => void;
}) {
  const searchParams = useSearchParams();
  const { value, setValue, markSynced } = useUrlSyncedValue(searchParams.get(paramKey) || "");
  const schedule = useDebouncedCommit(paramKey, commit, markSynced, 450);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value.replace(/[^\d]/g, "");
    setValue(next);
    schedule(next);
  };

  return (
    <Input
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      aria-label={label}
      className="h-9 text-sm"
    />
  );
}

function DebouncedText({
  paramKey,
  placeholder,
  commit,
}: {
  paramKey: string;
  placeholder: string;
  commit: (mutate: (params: URLSearchParams) => void) => void;
}) {
  const searchParams = useSearchParams();
  const { value, setValue, markSynced } = useUrlSyncedValue(searchParams.get(paramKey) || "");
  const schedule = useDebouncedCommit(paramKey, commit, markSynced, 500);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setValue(next);
    schedule(next.trim());
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
      <Input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label="Buscar por características"
        className="h-9 pl-8 text-sm"
      />
    </div>
  );
}

function LocalityPicker({
  localities,
  selected,
  onToggle,
}: {
  localities: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return localities;
    return localities.filter((l) => l.toLowerCase().includes(q));
  }, [localities, search]);

  return (
    <div>
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          aria-label="Buscar localidad"
          className="h-9 pl-8 text-sm"
        />
      </div>
      <div className="max-h-44 overflow-y-auto rounded-md border border-ink/10 bg-white">
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-xs text-ink/40">Sin resultados</p>
        )}
        {filtered.map((loc) => {
          const active = selected.includes(loc);
          return (
            <button
              key={loc}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(loc)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                active
                  ? "bg-brand text-black"
                  : "text-ink/80 hover:bg-ink/5"
              )}
            >
              <span className="truncate">{loc}</span>
              {active && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="mt-2 text-[11px] text-ink/50">
          {selected.length} seleccionada{selected.length === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

function SearchFirstPicker({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const query = search.toLowerCase().trim();
  const isSearching = query.length > 0;
  const filtered = useMemo(() => {
    if (!isSearching) return options;
    return options.filter((o) => o.toLowerCase().includes(query));
  }, [options, query, isSearching]);

  const listVisible = isSearching || showAll;

  return (
    <div>
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Buscar entre ${options.length}...`}
          aria-label="Buscar barrio"
          className="h-9 pl-8 text-sm"
        />
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selected.map((val) => (
            <button
              key={val}
              onClick={() => onToggle(val)}
              className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-black hover:bg-brand-dark hover:text-white transition-colors"
            >
              <span className="truncate max-w-35">{val}</span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* List — visible only while searching or explicitly expanded */}
      {listVisible && (
        <div className="max-h-44 overflow-y-auto rounded-md border border-ink/10 bg-white">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-ink/40">Sin resultados</p>
          )}
          {filtered.map((val) => {
            const active = selected.includes(val);
            return (
              <button
                key={val}
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(val)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors",
                  active
                    ? "bg-ink text-white"
                    : "text-ink/80 hover:bg-ink/5"
                )}
              >
                <span className="truncate">{val}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Expand / collapse toggle (hidden while searching) */}
      {!isSearching && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-[11px] font-medium text-ink/60 hover:text-ink transition-colors"
        >
          {showAll ? "Ocultar lista" : `Ver todos (${options.length})`}
        </button>
      )}
    </div>
  );
}
