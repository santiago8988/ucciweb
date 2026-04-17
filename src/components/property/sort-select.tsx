"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT = "recent";

const SORT_LABELS: Record<string, string> = {
  recent: "Última actualización",
  price_asc: "Precio: menor a mayor",
  price_desc: "Precio: mayor a menor",
};

export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const current = searchParams.get("sort") || DEFAULT;

  const onChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === DEFAULT) params.delete("sort");
    else params.set("sort", value);
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/propiedades?${qs}` : "/propiedades", { scroll: false });
    });
  };

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="h-9 min-w-52 text-sm">
        <span className="text-ink/50 mr-2">Ordenar por:</span>
        <SelectValue>{() => SORT_LABELS[current]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">{SORT_LABELS.recent}</SelectItem>
        <SelectItem value="price_asc">{SORT_LABELS.price_asc}</SelectItem>
        <SelectItem value="price_desc">{SORT_LABELS.price_desc}</SelectItem>
      </SelectContent>
    </Select>
  );
}
