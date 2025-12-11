import { toast } from "sonner";

export interface ConfirmOptions {
  confirmLabel?: string;
  cancelLabel?: string;
}

export function confirmToast(
  message: string,
  { confirmLabel = "Delete", cancelLabel = "Cancel" }: ConfirmOptions = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    toast(message, {
      action: {
        label: confirmLabel,
        onClick: () => resolve(true),
      },
      cancel: {
        label: cancelLabel,
        onClick: () => resolve(false),
      },
    });
  });
}
