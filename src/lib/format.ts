type PriceValue = string | number | null | undefined;

export function formatPrice(price: PriceValue, currency: string = "ARS"): string {
  if (!price && price !== 0) return "";
  const num = Number(price);
  if (isNaN(num)) return "";
  if (currency === "USD") {
    return `US$ ${num.toLocaleString("es-AR")}`;
  }
  return `$ ${num.toLocaleString("es-AR")}`;
}

export function formatSurface(surface: PriceValue): string {
  if (!surface && surface !== 0) return "";
  const num = Number(surface);
  if (isNaN(num)) return "";
  return `${num.toLocaleString("es-AR")} m²`;
}

export function getMainImage(images: { imageUrl: string; isMain: boolean }[]): string {
  const main = images.find((img) => img.isMain);
  return main?.imageUrl || images[0]?.imageUrl || "/placeholder-property.jpg";
}

export const HIDDEN_PRICE_LABEL = "Consultar valor";
export const HIDDEN_LOCATION_LABEL = "Agendar una cita";

export function getPropertyPrice(property: {
  operationType: string;
  salePrice: PriceValue;
  rentPrice: PriceValue;
  currency: string;
  hideSalePrice?: boolean | null;
}): string {
  const hideSale = Boolean(property.hideSalePrice);

  if (property.operationType === "alquiler" && property.rentPrice) {
    return formatPrice(property.rentPrice, property.currency) + "/mes";
  }
  if (property.operationType === "venta") {
    if (hideSale) return HIDDEN_PRICE_LABEL;
    if (property.salePrice) {
      return formatPrice(property.salePrice, property.currency);
    }
  }
  if (property.operationType === "venta_alquiler") {
    const parts: string[] = [];
    if (hideSale) {
      parts.push(HIDDEN_PRICE_LABEL);
    } else if (property.salePrice) {
      parts.push(formatPrice(property.salePrice, property.currency));
    }
    if (property.rentPrice) parts.push(formatPrice(property.rentPrice, property.currency) + "/mes");
    return parts.join(" | ");
  }
  return "Consultar";
}
