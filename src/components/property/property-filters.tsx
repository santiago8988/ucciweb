"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OPERATION_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";

const ALL = "todos";

const OPERACION_LABELS: Record<string, string> = {
  [ALL]: "Todas las operaciones",
  ...OPERATION_TYPE_LABELS,
};

const TIPO_LABELS: Record<string, string> = {
  [ALL]: "Todos los tipos",
  ...PROPERTY_TYPE_LABELS,
};

function renderLabel(map: Record<string, string>, fallback: string) {
  return (value: string | null) =>
    typeof value === "string" && map[value] ? map[value] : fallback;
}

export function PropertyFilters({ localities }: { localities: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const operacion = searchParams.get("operacion") || ALL;
  const tipo = searchParams.get("tipo") || ALL;
  const localidad = searchParams.get("localidad") || ALL;

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== ALL) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/propiedades?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("/propiedades");
  };

  const hasFilters =
    (operacion !== ALL) || (tipo !== ALL) || (localidad !== ALL);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border md:p-6">
      <div className="grid gap-3 md:grid-cols-4">
        <Select value={operacion} onValueChange={(v) => updateFilter("operacion", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Operación">
              {renderLabel(OPERACION_LABELS, "Operación")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las operaciones</SelectItem>
            <SelectItem value="venta">Venta</SelectItem>
            <SelectItem value="alquiler">Alquiler</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tipo} onValueChange={(v) => updateFilter("tipo", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de propiedad">
              {renderLabel(TIPO_LABELS, "Tipo de propiedad")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tipos</SelectItem>
            <SelectItem value="casa">Casa</SelectItem>
            <SelectItem value="departamento">Departamento</SelectItem>
            <SelectItem value="terreno">Terreno</SelectItem>
            <SelectItem value="local_comercial">Local Comercial</SelectItem>
            <SelectItem value="oficina">Oficina</SelectItem>
            <SelectItem value="cochera">Cochera</SelectItem>
            <SelectItem value="galpon">Galpón</SelectItem>
          </SelectContent>
        </Select>

        <Select value={localidad} onValueChange={(v) => updateFilter("localidad", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Localidad">
              {(value) =>
                typeof value === "string" && value !== ALL
                  ? value
                  : "Todas las localidades"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las localidades</SelectItem>
            {localities.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} className="text-ink/60">
            <X className="mr-2 h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
