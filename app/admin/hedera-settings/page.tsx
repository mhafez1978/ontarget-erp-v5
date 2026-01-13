import { HederaSettingsForm } from "@/components/hedera-settings-form";
import { HederaCostDashboard } from "@/components/hedera-cost-dashboard";

export default function HederaSettingsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Hedera Blockchain Settings</h1>
        <p className="text-muted-foreground">
          Configure and monitor Hedera blockchain integration for immutable
          record anchoring
        </p>
      </div>

      <HederaSettingsForm />

      <div>
        <h2 className="text-2xl font-bold mb-4">Cost Management Dashboard</h2>
        <HederaCostDashboard />
      </div>
    </div>
  );
}
