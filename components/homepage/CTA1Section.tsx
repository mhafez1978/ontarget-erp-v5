import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
export function CTA1Section() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/90 to-primary p-12 text-center text-primary-foreground shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of companies already using OnTarget ERP to
              streamline their operations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="group">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
