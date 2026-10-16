import { ShieldCheck } from "lucide-react";
import { BasePolicy } from "./BasePolicy";

const GeneralPolicy = () => {
  return (
    <BasePolicy
      title="General Policy"
      icon={ShieldCheck}
      lastUpdated="January 2026"
      content={
        <div className="space-y-12">
          <p className="text-xl text-foreground font-medium leading-relaxed italic border-l-4 border-secondary pl-6">
            Welcome to the Six Yards Love policies. They are designed to keep
            your shopping experience safe, fair, and transparent.
          </p>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">01.</span> General Provisions
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                By using the Six Yards Love platform, you formally agree to comply with
                all policies set forth to ensure a safe and fair shopping
                experience for every customer.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">02.</span> Customer Support
            </h2>
            <div className="bg-secondary/5 p-6 rounded-2xl border border-secondary/10 flex items-center gap-6">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-2">
                  For any policy-related questions, please reach out to our
                  support team.
                </p>
                <a
                  href="mailto:customer-support@sixyardslove.com"
                  className="text-sm font-bold text-primary underline underline-offset-4 decoration-primary/30"
                >
                  customer-support@sixyardslove.com
                </a>
              </div>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default GeneralPolicy;
