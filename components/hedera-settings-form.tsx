"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface HederaSettings {
  configured: boolean;
  isActive: boolean;
  network?: string;
  topicId?: string;
  currentBalance?: string;
  lowBalanceThreshold?: string;
  lastBalanceCheck?: string;
  estimatedCostPerTx?: string;
  totalTransactions?: number;
  totalCostHbar?: string;
}

export function HederaSettingsForm() {
  const [settings, setSettings] = useState<HederaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  // Test connection state
  const [testing, setTesting] = useState(false);
  const [testBalance, setTestBalance] = useState<string | null>(null);
  const [autoSaveOnTest, setAutoSaveOnTest] = useState(true);

  // Form state
  const [accountId, setAccountId] = useState("");
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [keyType, setKeyType] = useState<string>("ECDSA");
  const [hexPrivateKey, setHexPrivateKey] = useState("");
  const [derPrivateKey, setDerPrivateKey] = useState("");
  const [derPublicKey, setDerPublicKey] = useState("");
  const [topicId, setTopicId] = useState("");
  const [network, setNetwork] = useState<string>("TESTNET");
  const [isActive, setIsActive] = useState(false);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState("10");

  // visibility toggles
  const [showHexPrivate, setShowHexPrivate] = useState(false);
  const [showDerPrivate, setShowDerPrivate] = useState(false);
  const [showDerPublic, setShowDerPublic] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/hedera-settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setSettings(data);

      // Populate form with existing values
      if (data.topicId) setTopicId(data.topicId);
      setNetwork(data.network || "TESTNET");
      setIsActive(data.isActive);
      if (data.lowBalanceThreshold)
        setLowBalanceThreshold(data.lowBalanceThreshold);

      // Non-sensitive derived/display fields
      setEvmAddress(data.evmAddress || null);
      setKeyType(data.keyType || "ECDSA");
    } catch (error) {
      console.error("Failed to fetch Hedera settings:", error);
      toast.error("Failed to load Hedera settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (options?: { clearSensitive?: boolean }) => {
    const clearSensitive = options?.clearSensitive ?? true;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/hedera-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: accountId || undefined,
          hexPrivateKey: hexPrivateKey || undefined,
          derPrivateKey: derPrivateKey || undefined,
          derPublicKey: derPublicKey || undefined,
          evmAddress: evmAddress || undefined,
          keyType: keyType || undefined,
          topicId,
          network,
          isActive,
          lowBalanceThreshold: parseFloat(lowBalanceThreshold),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      toast.success("Hedera settings saved successfully");

      // Clear sensitive fields optionally
      if (clearSensitive) {
        setAccountId("");
        setHexPrivateKey("");
        setDerPrivateKey("");
      }

      // Refresh settings
      await fetchSettings();
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshingBalance(true);
    try {
      const response = await fetch("/api/admin/hedera-settings/balance", {
        method: "PUT",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to refresh balance");
      }

      const data = await response.json();
      toast.success(
        `Balance updated: ${parseFloat(data.balance).toFixed(4)} ℏ`
      );
      await fetchSettings();
    } catch (error) {
      console.error("Failed to refresh balance:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to refresh balance"
      );
    } finally {
      setRefreshingBalance(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hedera Blockchain Status</CardTitle>
              <CardDescription>
                Global configuration for immutable record anchoring
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {settings?.configured ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Not Configured
                </Badge>
              )}
              {settings?.isActive && <Badge variant="default">Active</Badge>}
              <Badge
                variant={
                  settings?.network === "TESTNET" ? "outline" : "default"
                }
              >
                {settings?.network === "TESTNET"
                  ? "Testnet"
                  : settings?.network === "PREVIEWNET"
                  ? "Previewnet"
                  : "Mainnet"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        {settings?.configured && settings.currentBalance && (
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold">
                  {parseFloat(settings.currentBalance).toFixed(4)} ℏ
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Transactions
                </p>
                <p className="text-2xl font-bold">
                  {settings.totalTransactions || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">
                  {parseFloat(settings.totalCostHbar || "0").toFixed(4)} ℏ
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshBalance}
                disabled={refreshingBalance}
              >
                {refreshingBalance ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Balance
              </Button>
              <p className="text-xs text-muted-foreground">
                Last checked:{" "}
                {settings.lastBalanceCheck
                  ? new Date(settings.lastBalanceCheck).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Hedera Configuration</CardTitle>
          <CardDescription>
            Configure Hedera account credentials and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!settings?.configured && (
            <Alert>
              <AlertDescription>
                Enter your Hedera account credentials to enable blockchain
                anchoring. Credentials are encrypted before storage.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Account ID */}
            <div className="space-y-2">
              <Label htmlFor="accountId">
                Hedera Account ID <span className="text-red-500">*</span>
                {settings?.configured && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="accountId"
                placeholder="0.0.12345"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>

            {/* Key Type & EVM Address */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="keyType">Key Type</Label>
                <select
                  id="keyType"
                  className="block w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value)}
                >
                  <option value="ECDSA">ECDSA (secp256k1)</option>
                  <option value="ED25519">ED25519</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Choose the key type. Use <strong>ECDSA</strong> for EVM/
                  smart-contract compatibility.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evmAddress">EVM Address</Label>
                <Input
                  id="evmAddress"
                  placeholder="0x..."
                  value={evmAddress || ""}
                  onChange={(e) => setEvmAddress(e.target.value || null)}
                />
                <p className="text-xs text-muted-foreground">
                  EVM address derived from ECDSA public key (optional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="network">Network</Label>
                <select
                  id="network"
                  className="block w-full rounded border border-slate-200 px-3 py-2 text-sm"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                >
                  <option value="TESTNET">Testnet</option>
                  <option value="PREVIEWNET">Previewnet</option>
                  <option value="MAINNET">Mainnet</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Select the Hedera network to use when testing and sending
                  transactions.
                </p>
              </div>
            </div>

            {/* Topic ID */}
            <div className="space-y-2">
              <Label htmlFor="topicId">
                Topic ID <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="topicId"
                  placeholder="0.0.67890"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    try {
                      setSaving(true);
                      const response = await fetch("/api/admin/hedera/topic", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          memo: `Created via UI`,
                          network,
                        }),
                      });

                      if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error || "Failed to create topic");
                      }

                      const data = await response.json();
                      setTopicId(data.topicId);
                      toast.success(`Created topic ${data.topicId}`);
                    } catch (err) {
                      console.error("Failed to create topic:", err);
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : "Failed to create topic"
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Create Topic
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Topics are created programmatically (e.g., via the Hedera SDK
                TopicCreateTransaction). Click "Create Topic" to auto-generate a
                topic and populate this field, or paste an existing Topic ID.
              </p>
            </div>

            {/* Private Keys */}
            <div className="space-y-2">
              <Label htmlFor="hexPrivateKey">
                HEX Encoded Private Key (ECDSA){" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="hexPrivateKey"
                  type={showHexPrivate ? "text" : "password"}
                  placeholder="0x..."
                  value={hexPrivateKey}
                  onChange={(e) => setHexPrivateKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowHexPrivate(!showHexPrivate)}
                >
                  {showHexPrivate ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste your ECDSA HEX private key if available (e.g. 0x4c0883...
                or without the 0x prefix). This is recommended for EVM
                compatibility and is the easiest to use with the Test Connection
                tool.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="derPrivateKey">DER Encoded Private Key</Label>
              <div className="relative">
                <Input
                  id="derPrivateKey"
                  type={showDerPrivate ? "text" : "password"}
                  placeholder="-----BEGIN PRIVATE KEY-----"
                  value={derPrivateKey}
                  onChange={(e) => setDerPrivateKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowDerPrivate(!showDerPrivate)}
                >
                  {showDerPrivate ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="derPublicKey">DER Encoded Public Key</Label>
              <div className="relative">
                <Input
                  id="derPublicKey"
                  type={showDerPublic ? "text" : "password"}
                  placeholder="-----BEGIN PUBLIC KEY-----"
                  value={derPublicKey}
                  onChange={(e) => setDerPublicKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowDerPublic(!showDerPublic)}
                >
                  {showDerPublic ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                (Optional) DER-encoded keys provided by Hedera Developer Portal.
                You may paste the PEM/DER block (-----BEGIN PRIVATE KEY-----...)
                if that&apos;s what you have.
              </p>
            </div>

            {/* Low Balance Threshold */}
            <div className="space-y-2">
              <Label htmlFor="threshold">
                Low Balance Alert Threshold (HBAR)
              </Label>
              <Input
                id="threshold"
                type="number"
                step="0.01"
                min="0"
                placeholder="10"
                value={lowBalanceThreshold}
                onChange={(e) => setLowBalanceThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Receive alerts when balance drops below this amount
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 w-full">
              <Button
                variant="outline"
                onClick={async () => {
                  setTesting(true);
                  try {
                    const response = await fetch(
                      "/api/admin/hedera-settings/test",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          accountId: accountId || undefined,
                          hexPrivateKey: hexPrivateKey || undefined,
                          derPrivateKey: derPrivateKey || undefined,
                          keyType: keyType || undefined,
                          network,
                        }),
                      }
                    );

                    if (!response.ok) {
                      const err = await response.json();
                      throw new Error(err.error || "Connection test failed");
                    }

                    const data = await response.json();
                    setTestBalance(data.balance);

                    // Server-supplied evmAddress if available
                    if (data?.evmAddress) {
                      setEvmAddress(data.evmAddress);
                    } else if (hexPrivateKey && keyType === "ECDSA") {
                      // Try to derive client-side from HEX private key
                      try {
                        const ethers = await import("ethers");
                        let pk = hexPrivateKey.trim();
                        if (!pk.startsWith("0x")) pk = `0x${pk}`;
                        const wallet = new ethers.Wallet(pk);
                        setEvmAddress(wallet.address);
                        toast.success(`Derived EVM address: ${wallet.address}`);
                      } catch (err) {
                        console.warn(
                          "Failed to derive EVM address locally:",
                          err
                        );
                      }
                    }

                    toast.success(
                      `Connection OK — balance ${parseFloat(
                        data.balance
                      ).toFixed(4)} ℏ`
                    );

                    if (autoSaveOnTest) {
                      await handleSave();
                    }
                  } catch (err) {
                    console.error("Test connection failed:", err);
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Test connection failed"
                    );
                  } finally {
                    setTesting(false);
                  }
                }}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>

              {testBalance && (
                <Badge variant="secondary">
                  Balance: {parseFloat(testBalance).toFixed(4)} ℏ
                </Badge>
              )}

              {evmAddress && (
                <div className="ml-2">
                  <Badge variant="outline" className="gap-1">
                    EVM: {evmAddress}
                  </Badge>
                </div>
              )}

              <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="autosave"
                    checked={autoSaveOnTest}
                    onCheckedChange={(val) => setAutoSaveOnTest(Boolean(val))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-save on success
                  </p>
                </div>

                <Button
                  variant="ghost"
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        "/api/admin/hedera-settings/derive",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            hexPrivateKey: hexPrivateKey || undefined,
                            derPrivateKey: derPrivateKey || undefined,
                            keyType,
                          }),
                        }
                      );

                      if (!response.ok) {
                        const err = await response.json();
                        throw new Error(
                          err.error || "Failed to derive EVM address"
                        );
                      }

                      const data = await response.json();
                      if (data?.evmAddress) {
                        setEvmAddress(data.evmAddress);
                        toast.success(
                          `Derived EVM address: ${data.evmAddress}`
                        );
                      } else {
                        toast.error("Unable to derive EVM address");
                      }
                    } catch (err: any) {
                      console.error("Derive EVM failed:", err);
                      toast.error(err?.message || "Derive EVM failed");
                    }
                  }}
                >
                  Derive EVM
                </Button>

                <Button onClick={() => handleSave()} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
