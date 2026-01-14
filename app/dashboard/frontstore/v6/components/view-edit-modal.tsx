"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";

export default function ViewEditModal({
  open,
  onOpenChange,
  variant,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: {
    id: string;
    title: string;
    type: string;
    assets?: { id: string; type: string; url?: string }[];
  } | null;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [title, setTitle] = useState(variant?.title || "");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(
    variant?.assets?.[0]?.url || null
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(
    variant?.assets?.find((a: any) => a.type === "video")?.url || null
  );
  const [processingVideo, setProcessingVideo] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(
    (variant as any)?.meta?.prompt || ""
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitle(variant?.title || "");
    setImageUrl(variant?.assets?.[0]?.url || null);
    setVideoUrl(
      variant?.assets?.find((a: any) => a.type === "video")?.url || null
    );
    setPrompt((variant as any)?.meta?.prompt || "");
  }, [variant]);

  function handleRegenerateImage() {
    // Placeholder: fetch an Unsplash random image for demo
    const randomId = Math.floor(Math.random() * 1000);
    const url = `https://source.unsplash.com/featured/1600x900?sig=${randomId}`;
    setImageUrl(url);
  }

  async function handleApplyCustomUrl(url: string) {
    if (!url) return alert("Please provide an image URL");
    setImageUrl(url);
  }

  function handleUploadFile(file: File | null) {
    if (!file) return;
    // For now, create local object URL (in real app, upload to cold storage)
    const url = URL.createObjectURL(file);
    setImageUrl(url);
  }

  async function handleGenerateVideo() {
    // Placeholder: simulate video generation and set sample video URL
    setProcessingVideo(true);
    setTimeout(() => {
      setProcessingVideo(false);
      setVideoUrl(
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
      );
    }, 1500);
  }

  function handleSave() {
    const payload = {
      id: variant?.id,
      title,
      subtitle,
      assets: [
        imageUrl ? { type: "image", url: imageUrl } : null,
        videoUrl ? { type: "video", url: videoUrl } : null,
      ].filter(Boolean),
    };
    onSave(payload);
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <div className="v6-modal-overlay" />
        <Dialog.Content
          className="v6-modal-content"
          aria-label="View & Edit Variant"
        >
          <div className="v6-modal-inner" style={{ width: 900, height: 700 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0 }}>
                {variant ? `Edit: ${variant.title}` : "Edit Variant"}
              </h2>
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

            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
                >
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", padding: 8, borderRadius: 6 }}
                />

                <label
                  style={{
                    display: "block",
                    marginTop: 12,
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Subtitle
                </label>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e: any) => setSubtitle(e.target.innerText)}
                  style={{
                    minHeight: 120,
                    padding: 8,
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.01)",
                  }}
                >
                  {subtitle}
                </div>

                <div style={{ marginTop: 12 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Image
                  </label>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 220,
                        height: 124,
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{ color: "var(--v6-muted)" }}>No image</div>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <button
                        className="button small"
                        onClick={handleRegenerateImage}
                      >
                        🔄 Regenerate
                      </button>
                      <button
                        className="button small"
                        onClick={() => {
                          const url = window.prompt("Image URL:");
                          if (url) handleApplyCustomUrl(url);
                        }}
                      >
                        🔗 Custom URL
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) =>
                          handleUploadFile(e.target.files?.[0] || null)
                        }
                      />
                      <button
                        className="button small"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        📁 Upload
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label
                    style={{
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Video
                  </label>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 220,
                        height: 124,
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {videoUrl ? (
                        <video
                          src={videoUrl}
                          controls
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div style={{ color: "var(--v6-muted)" }}>
                          {processingVideo ? "Generating..." : "No video"}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <textarea
                        placeholder="Generation prompt (optional)"
                        value={prompt || ""}
                        onChange={(e) => setPrompt(e.target.value)}
                        style={{ minHeight: 80, padding: 8, borderRadius: 6 }}
                      />
                      <button
                        className="button small"
                        onClick={async () => {
                          // Save prompt to variant meta via PATCH
                          if (!variant) return;
                          try {
                            const res = await fetch(
                              `/api/frontstore/v6/sections/${
                                (variant as any).__sectionId || ""
                              }/variants/${variant.id}`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  meta: { ...(variant as any).meta, prompt },
                                }),
                              }
                            );
                            if (!res.ok)
                              throw new Error("Failed to save prompt");
                            toast.success("Prompt saved");
                          } catch (err) {
                            console.error(err);
                            toast.error("Failed to save prompt");
                          }
                        }}
                      >
                        Save Prompt
                      </button>
                      <button
                        className="button small"
                        onClick={async () => {
                          // Trigger generate video API (uses section inference server-side)
                          if (!variant) return;
                          setProcessingVideo(true);
                          try {
                            const res = await fetch(
                              "/api/frontstore/v6/generate-video",
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  sectionId: (variant as any).__sectionId,
                                  variantId: variant.id,
                                  prompt,
                                }),
                              }
                            );
                            if (!res.ok)
                              throw new Error("Failed to enqueue video");
                            const j = await res.json();
                            toast.success("Video job enqueued");
                          } catch (err) {
                            console.error(err);
                            toast.error("Failed to enqueue video");
                          } finally {
                            setProcessingVideo(false);
                          }
                        }}
                        disabled={processingVideo}
                      >
                        {processingVideo ? "Processing…" : "Generate Video"}
                      </button>
                      <button
                        className="button small"
                        onClick={() => {
                          setVideoUrl(null);
                          alert("Video removed (local demo)");
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ width: 320 }}>
                <h4 style={{ marginTop: 0 }}>Preview</h4>
                <div
                  style={{
                    width: "100%",
                    height: 430,
                    background: "rgba(255,255,255,0.01)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      color: "var(--v6-muted)",
                      textAlign: "center",
                      padding: 12,
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 20 }}>{title}</div>
                    <div style={{ marginTop: 8 }}>
                      {subtitle || "Subtitle preview"}
                    </div>
                    {imageUrl && (
                      <div style={{ marginTop: 12 }}>
                        <img
                          src={imageUrl}
                          alt="preview"
                          style={{
                            width: 280,
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                      </div>
                    )}
                    {videoUrl && (
                      <div style={{ marginTop: 12 }}>
                        <video
                          src={videoUrl}
                          controls
                          style={{
                            width: 280,
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <style jsx global>{`
        .v6-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 9998;
        }
        .v6-modal-content {
          position: fixed;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: var(--v6-surface);
          border-radius: 10px;
          padding: 20px;
          z-index: 9999;
          box-shadow: 0 10px 60px rgba(2, 6, 23, 0.6);
        }
      `}</style>
    </Dialog.Root>
  );
}
