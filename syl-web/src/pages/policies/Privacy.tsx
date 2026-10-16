import { ShieldCheck } from "lucide-react";
import { BasePolicy } from "./BasePolicy";

const Privacy = () => {
  return (
    <BasePolicy
      title="Privacy Policy"
      icon={ShieldCheck}
      lastUpdated="January 2026"
      content={
        <div className="space-y-12">
          <p className="text-xl text-foreground font-medium leading-relaxed italic border-l-4 border-secondary pl-6">
            Your privacy is paramount to us at Six Yards Love. This policy outlines how
            we handle your data with the utmost transparency and respect for
            your digital rights.
          </p>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">01.</span> Data Collection
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                We collect only the information needed to process your orders
                and give you a seamless shopping experience:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Name & Account details",
                  "Shipping & Billing addresses",
                  "Verified email addresses & Phone numbers",
                  "Transaction history & Feedback",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm font-medium text-foreground/70 bg-primary/5 p-3 rounded-lg border border-primary/10"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">02.</span> Purpose & Usage
            </h2>
            <div className="space-y-4 ml-4">
              <p className="text-base text-foreground/80 leading-relaxed">
                Your data is used{" "}
                <span className="font-bold text-primary">
                  solely for the purpose
                </span>{" "}
                of fulfilling your orders and improving your shopping
                experience.
              </p>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                </div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  We do not sell, rent, or trade your data with third parties.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">03.</span> Security Measures
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                We implement industry-standard encryption and security protocols
                to protect your information from unauthorized access,
                disclosure, or alteration.
              </p>
              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground italic">
                  Compliance: We adhere to the Digital Personal Data Protection
                  Act, 2023.
                </p>
              </div>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Privacy;
