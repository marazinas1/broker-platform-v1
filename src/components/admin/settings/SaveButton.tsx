import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  onSubmit: () => Promise<void>;
  disabled?: boolean;
  children?: ReactNode;
}

export function SaveButton({ onSubmit, disabled, children }: Props) {
  const { t } = useTranslation();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleClick() {
    setState("saving");
    setErrorMsg(null);
    try {
      await onSubmit();
      setState("saved");
      window.setTimeout(() => setState("idle"), 2000);
    } catch (e) {
      setState("error");
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled || state === "saving"}
      >
        {state === "saving" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {state === "saved" && <Check className="mr-2 h-4 w-4" />}
        {state === "saving"
          ? t("admin.settings.saving")
          : state === "saved"
            ? t("admin.settings.saved")
            : (children ?? t("admin.settings.save"))}
      </Button>
      {state === "error" && (
        <span className="text-sm text-destructive">
          {t("admin.settings.saveError")}
          {errorMsg ? `: ${errorMsg}` : ""}
        </span>
      )}
    </div>
  );
}
