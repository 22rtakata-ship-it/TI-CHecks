import type { ValidityTrend } from "./types";

export const formatValidityNumber = (value: number) =>
  value.toLocaleString("pt-BR");
export const compactValidityNumber = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});
export function trendLabel(trend: ValidityTrend) {
  if (trend.direction === "insufficient")
    return trend.latest === null
      ? "Nenhum registro neste mês."
      : "Mais um dia preenchido permitirá comparar a evolução.";
  if (trend.direction === "stable")
    return "Sem alteração entre o primeiro e o último registro.";
  const change = Math.abs(trend.change!);
  const prefix = trend.direction === "down" ? "Redução" : "Aumento";
  const percentage =
    trend.reductionPercent === null
      ? ""
      : ` (${formatValidityNumber(Math.abs(trend.reductionPercent))}%)`;
  return `${prefix} de ${formatValidityNumber(change)}${percentage} desde o primeiro registro.`;
}
