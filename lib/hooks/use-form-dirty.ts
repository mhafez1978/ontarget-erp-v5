import { useMemo } from "react";

/**
 * Hook to track if a form has been modified (is "dirty")
 * @param initialValues - The initial state of the form
 * @param currentValues - The current state of the form
 * @returns boolean indicating if form is dirty
 */
export function useFormDirty<T extends Record<string, unknown>>(
  initialValues: T,
  currentValues: T
): boolean {
  const isDirty = useMemo(() => {
    return Object.keys(currentValues).some(
      (key) => currentValues[key] !== initialValues[key]
    );
  }, [currentValues, initialValues]);

  return isDirty;
}

/**
 * Get className for pulsating button when form is dirty
 * @param isDirty - Whether the form has unsaved changes
 * @returns className string for the button
 */
export function getPulsateClassName(isDirty: boolean): string {
  return isDirty
    ? "animate-[heartbeat_1.5s_ease-in-out_infinite] shadow-lg shadow-purple-500/50 ring-1 ring-purple-400/50"
    : "";
}
