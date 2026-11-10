"use client";

import { ActivityForm } from "@/features/activities/ActivityForm";
import { Modal } from "@/components/ui/shared";
import type { WorkspaceController } from "./useWorkspaceController";

type ActivityDialogProps = {
  controller: Pick<
    WorkspaceController,
    | "form"
    | "data"
    | "date"
    | "store"
    | "setForm"
    | "submitActivity"
    | "removeExistingActivity"
  >;
};

export function ActivityDialog({ controller }: ActivityDialogProps) {
  const {
    form,
    data,
    date,
    store,
    setForm,
    submitActivity,
    removeExistingActivity,
  } = controller;
  return (
    <>
      {form && (
        <Modal
          title={form.existing ? "Editar atividade" : "Nova atividade"}
          onClose={() => setForm(null)}
        >
          <ActivityForm
            data={data}
            date={date}
            store={store}
            existing={form.existing}
            incidentId={form.incidentId}
            checklistId={form.checklistId}
            onSave={submitActivity}
            onRemove={removeExistingActivity}
          />
        </Modal>
      )}
    </>
  );
}
