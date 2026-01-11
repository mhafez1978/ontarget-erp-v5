"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface WebhookConfig {
  id: string;
  companyId: string;
  url: string;
  isActive: boolean;
  events?: string[];
  secret?: string | null;
}

export function WebhookManager({ companyId }: { companyId: string }) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<WebhookConfig | null>(null);
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [events, setEvents] = useState<string>("lead.created");

  useEffect(() => {
    if (!companyId) return;
    fetchWebhooks();
  }, [companyId]);

  // Strongly-typed deliveries state
  interface DeliveryRecord {
    id: string;
    webhookId: string;
    status: string;
    attempts: number;
    responseCode?: string | null;
    lastAttemptAt?: string | null;
  }

  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/company/webhooks`);
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        let msg = text || `${res.status} ${res.statusText}`;
        try {
          const parsed = text ? JSON.parse(text) : null;
          msg = parsed?.error || parsed?.message || msg;
        } catch (e) {
          /* ignore */
        }
        console.error("Failed to load webhooks:", res.status, msg);
        if (res.status === 401) {
          toast.error("Unauthorized — please sign in to manage webhooks");
        } else if (res.status >= 500) {
          // Likely a missing DB table or dev environment issue — non-fatal
          toast(`Webhooks unavailable in this environment`);
        } else {
          toast.error(`Failed to load webhooks: ${msg}`);
        }
        setWebhooks([]);
        return;
      }

      const data = await res.json();
      setWebhooks(data.webhooks || []);
      if (data && data.available === false) {
        // Webhook support not present in DB (dev/test); notify user non-fatally
        toast(`Webhooks unavailable in this environment`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async (webhookId: string) => {
    try {
      const res = await fetch(`/api/company/webhooks/${webhookId}/deliveries`);
      if (!res.ok) throw new Error("Failed to fetch deliveries");
      const data = await res.json();
      return data.deliveries || [];
    } catch (err) {
      console.error(err);
      toast.error("Could not load deliveries");
      return [];
    }
  };

  const openEdit = (w: WebhookConfig) => {
    setEditing(w);
    setUrl(w.url);
    setIsActive(Boolean(w.isActive));
    setEvents((w.events || []).join(","));
  };

  const generateSecret = () => {
    // simple client-side secret generator
    const s = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return s;
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const body: {
        url: string;
        isActive: boolean;
        events: string[];
      } = {
        url,
        isActive,
        events: events.split(",").map((s) => s.trim()),
      };
      const res = await fetch(`/api/company/webhooks/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
      toast.success("Webhook updated");
      setEditing(null);
      fetchWebhooks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update webhook");
    }
  };

  const rotateSecret = async () => {
    if (!editing) return;
    try {
      const newSecret = generateSecret();
      const res = await fetch(`/api/company/webhooks/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: newSecret }),
      });
      if (!res.ok) throw new Error("Rotate failed");
      toast.success("Secret rotated");
      fetchWebhooks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to rotate secret");
    }
  };

  const [deliveriesOpen, setDeliveriesOpen] = useState(false);

  const viewDeliveries = async (id: string) => {
    const ds = await fetchDeliveries(id);
    if (ds.length === 0) {
      toast("No deliveries yet");
      return;
    }
    setDeliveries(ds);
    setDeliveriesOpen(true);
  };

  const retryDelivery = async (webhookId: string, deliveryId: string) => {
    try {
      const res = await fetch(
        `/api/company/webhooks/${webhookId}/deliveries/${deliveryId}/retry`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Retry failed");
      toast.success("Delivery re-queued");
      const ds = await fetchDeliveries(webhookId);
      setDeliveries(ds);
    } catch (err) {
      console.error(err);
      toast.error("Failed to retry delivery");
    }
  };

  const sendDeliveryNow = async (webhookId: string, deliveryId: string) => {
    try {
      const res = await fetch(
        `/api/company/webhooks/${webhookId}/deliveries/${deliveryId}/send`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success("Delivery sent");
      } else {
        toast.error(`Send failed: ${data.error || data.body || data.code}`);
      }
      const ds = await fetchDeliveries(webhookId);
      setDeliveries(ds);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send delivery");
    }
  };

  const createWebhook = async () => {
    try {
      const body = {
        companyId,
        url,
        isActive,
        events: events.split(",").map((s) => s.trim()),
      };
      const res = await fetch(`/api/company/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Create failed");
      toast.success("Webhook created");
      setUrl("");
      fetchWebhooks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create webhook");
    }
  };

  const testWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/company/webhooks/${id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Test sent (${data.code})`);
      } else {
        toast.error(`Test failed: ${data.error || "unknown"}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Test failed");
    }
  };

  const removeWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/company/webhooks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Webhook removed");
      fetchWebhooks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete webhook");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhooks</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading webhooks...</div>
        ) : (
          <>
            {/* Info panel: How webhooks work */}
            <div className="rounded-md border bg-blue-50 p-4 mb-4">
              <h4 className="font-semibold">How Webhooks Work</h4>
              <p className="text-sm text-muted-foreground">
                Webhooks send HTTP POST requests to your endpoint when events
                occur (for example, when a lead is created from the chat
                widget). Configure the URL, choose events to subscribe to (e.g.{" "}
                <code>lead.created</code>), and optionally set a signing secret.
              </p>
              <div className="mt-2 text-sm">
                <div>
                  <strong>Example POST payload URL:</strong>
                </div>
                <code className="block bg-muted px-2 py-1 rounded mt-1">
                  https://hooks.mycrm.com/incoming
                </code>
                <div className="mt-2">
                  <strong>Sample payload (JSON):</strong>
                </div>
                <pre className="mt-1 text-xs bg-black/5 p-2 rounded">
                  {`{
  "type": "lead.created",
  "lead": { "id": "lead_123", "email": "jane@example.com", "message": "Interested in a website" }
}`}
                </pre>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/webhook"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Input
                  placeholder="events (comma separated)"
                  value={events}
                  onChange={(e) => setEvents(e.target.value)}
                />
                <Switch
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(Boolean(v))}
                />
                <Button onClick={createWebhook}>Add</Button>
              </div>

              <div className="space-y-2">
                {webhooks.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between border rounded px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">{w.url}</div>
                      <div className="text-sm text-muted-foreground">
                        Events: {(w.events || []).join(", ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => viewDeliveries(w.id)}>
                        Deliveries
                      </Button>
                      <Button size="sm" onClick={() => openEdit(w)}>
                        Edit
                      </Button>
                      <Button size="sm" onClick={() => testWebhook(w.id)}>
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeWebhook(w.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Dialog
                open={!!editing}
                onOpenChange={(v) => !v && setEditing(null)}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Webhook</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="URL"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <Input
                      placeholder="Events (comma separated)"
                      value={events}
                      onChange={(e) => setEvents(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <label>Active:</label>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(v) => setIsActive(Boolean(v))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={rotateSecret}>Rotate Secret</Button>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={saveEdit}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={deliveriesOpen}
                onOpenChange={(v) => setDeliveriesOpen(v)}
              >
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Webhook Deliveries</DialogTitle>
                  </DialogHeader>

                  <div className="mt-2">
                    <table className="w-full border-collapse table-auto text-left text-sm">
                      <thead>
                        <tr>
                          <th className="p-2">ID</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Attempts</th>
                          <th className="p-2">Response</th>
                          <th className="p-2">Last Attempt</th>
                          <th className="p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveries.map((d) => (
                          <tr key={d.id} className="border-t">
                            <td className="p-2 align-top">{d.id}</td>
                            <td className="p-2 align-top">{d.status}</td>
                            <td className="p-2 align-top">{d.attempts}</td>
                            <td className="p-2 align-top">
                              {d.responseCode || "-"}
                            </td>
                            <td className="p-2 align-top">
                              {d.lastAttemptAt || "-"}
                            </td>
                            <td className="p-2 align-top">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    retryDelivery(d.webhookId, d.id)
                                  }
                                >
                                  Re-queue
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    sendDeliveryNow(d.webhookId, d.id)
                                  }
                                >
                                  Send Now
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button>Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
