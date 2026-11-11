import type { AppData } from "@/types/domain";
const schedules: [string, number[]][] = [
  ["Checklist diário", [1, 2, 3, 4, 5]],
  ["Checklist de balanças PDV", [2]],
  ["Checklist de balanças de setores", [4]],
  ["Checklist de coletores", [5]],
  ["Checklist de balança da doca", [6]],
];
export function initialData(): AppData {
  return {
    version: 1,
    validityRecords: [],
    titlePresets: [],
    activities: [],
    incidents: [],
    executions: [],
    evidence: [],
    templates: schedules.map(([name, weekdays], i) => ({
      id: `00000000-0000-4000-8000-00000000000${i}`,
      name,
      description: "",
      active: true,
      recurring: true,
      weekdays,
      date: "",
      start: "",
      end: "",
    })),
    categories: [
      "PDV / Frente de caixa",
      "Coletores",
      "Balanças",
      "Impressoras",
      "TVs e monitores",
      "Computadores",
      "Celulares",
      "Rede e infraestrutura",
      "Sistemas e softwares",
      "Auditorias",
      "Manutenção preventiva",
      "Suporte aos usuários",
      "Outros",
    ],
  };
}
