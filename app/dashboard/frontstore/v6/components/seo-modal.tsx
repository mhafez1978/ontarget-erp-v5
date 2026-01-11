"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export default function SeoModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: { title?: string; description?: string } | null;
  onSave: (data: { title?: string; description?: string }) => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");

  useEffect(() => {
    setTitle(initial?.title || "");
    setDescription(initial?.description || "");
  }, [initial]);

  function handleSave() {
    onSave({ title, description });
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <div className="v6-modal-overlay" />
        <Dialog.Content className="v6-modal-content" aria-label="SEO">
          <div style={{ width: 520 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>SEO</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="button small"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </button>
                <button className="button small" onClick={handleSave}>
                  Save
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontWeight: 600 }}>
                Meta Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6 }}
              />

              <label
                style={{ display: "block", fontWeight: 600, marginTop: 12 }}
              >
                Meta Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 6 }}
                rows={4}
              />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
