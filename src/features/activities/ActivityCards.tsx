"use client";

import { ArrowUpRight, CircleDot, Clock3 } from "lucide-react";
import type { Activity } from "@/types/domain";
import { formatDuration } from "@/lib/duration";
import { Empty } from "@/components/ui/shared";
import { CopyTicketButton } from "@/components/ui/CopyTicketButton";
import { TechnicalStatusBadge } from "@/components/ui/TechnicalStatusBadge";
import { statusClassName } from "@/components/ui/statusPresentation";

export function ActivityCards({
  activities,
  onEdit,
}: {
  activities: Activity[];
  onEdit: (a: Activity) => void;
}) {
  return (
    <div className="activity-list">
      {activities.length ? (
        activities.map((a) => (
          <article
            className={`activity-card ${statusClassName(a.status)}`}
            key={a.id}
          >
            <div className="activity-symbol">
              <CircleDot size={20} />
            </div>
            <div className="grow">
              <div className="activity-meta">
                <span>{a.date.split("-").reverse().join("/")}</span>
                <span>·</span>
                <span>
                  {new Date(a.createdAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  })}
                </span>
                <span>·</span>
                <span>{a.category}</span>
                {a.sector && (
                  <>
                    <span>·</span>
                    <span>{a.sector}</span>
                  </>
                )}
              </div>
              <h3>{a.title}</h3>
              {(a.description ?? (a.result || a.procedure)) && (
                <p>{a.description ?? (a.result || a.procedure)}</p>
              )}
              <div className="activity-foot">
                <TechnicalStatusBadge status={a.status} />
                {a.minutes !== undefined && (
                  <span>
                    <Clock3 size={13} />
                    {formatDuration(a.minutes)}
                  </span>
                )}
                <CopyTicketButton ticket={a.ticket} />
                {a.incidentId && <span>Ocorrência vinculada</span>}
              </div>
            </div>
            <button
              className="icon-button"
              aria-label={`Editar ${a.title}`}
              onClick={() => onEdit(a)}
            >
              <ArrowUpRight size={19} />
            </button>
          </article>
        ))
      ) : (
        <Empty title="O dia começa por aqui">
          Registre sua primeira atividade e mantenha seu histórico em dia.
        </Empty>
      )}
    </div>
  );
}
