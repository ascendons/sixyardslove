import { RefreshCcw } from "lucide-react";
import { BasePolicy } from "./BasePolicy";

const Returns = () => {
  return (
    <BasePolicy
      title="Returns & Exchanges"
      icon={RefreshCcw}
      lastUpdated="January 2026"
      content={
        <div className="space-y-12">
          <p className="text-xl text-foreground font-medium leading-relaxed italic border-l-4 border-secondary pl-6">
            We stand by every saree we sell. If you are not entirely satisfied
            with your purchase, we are here to ensure a fair resolution.
          </p>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">01.</span> Quality Standards
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                If a product does not meet the Six Yards Love quality standards upon
                arrival, please contact us within{" "}
                <span className="font-bold text-primary underline decoration-primary/20 underline-offset-4">
                  48 hours
                </span>
                .
              </p>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 italic text-sm text-amber-900 font-medium">
                Photographic evidence is mandatory for all quality-related
                claims.
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">02.</span> Exchange Procedure
            </h2>
            <div className="space-y-4 ml-4">
              <p className="text-base text-foreground/80 leading-relaxed">
                Due to the{" "}
                <span className="text-secondary font-bold">
                  handpicked and limited-stock nature
                </span>{" "}
                of our products, direct exchanges are subject to stock
                availability.
              </p>
              <div className="bg-secondary/5 p-6 rounded-2xl border border-secondary/10">
                <h3 className="font-bold text-secondary mb-2 uppercase text-xs tracking-widest">
                  Resolution Options
                </h3>
                <ul className="space-y-2">
                  <li className="text-sm flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-secondary" />
                    Replacement with the same item (if available)
                  </li>
                  <li className="text-sm flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-secondary" />
                    Issuance of a store credit note for future purchases
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">03.</span> Our Commitment
            </h2>
            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 italic">
              <p className="text-sm leading-relaxed font-medium text-primary">
                "Every return is reviewed with care, so you can shop with
                complete confidence in Six Yards Love."
              </p>
            </div>
          </section>
        </div>
      }
    />
  );
};

export default Returns;
