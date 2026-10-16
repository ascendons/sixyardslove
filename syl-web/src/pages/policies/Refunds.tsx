import { RefreshCcw } from "lucide-react";
import { BasePolicy } from "./BasePolicy";

const Refunds = () => {
  return (
    <BasePolicy
      title="Cancellation and Refund Policy"
      icon={RefreshCcw}
      lastUpdated="February 2025"
      content={
        <div className="space-y-12">
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <p className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Effective Date: February 1, 2025
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Policy ID:{" "}
              <span className="font-semibold text-foreground">
                POL-CR-SYL-001
              </span>
            </p>
          </div>

          <p className="text-xl text-foreground font-medium leading-relaxed italic border-l-4 border-secondary pl-6">
            This Cancellation and Refund Policy (“Policy”) applies to all
            purchases made on the Six Yards Love e-commerce platform, operated by
            [SYL legal entity TBD].
          </p>

          <section className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary text-2xl">01.</span> Cancellation
              Policy
            </h2>

            <div className="space-y-8 ml-4">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">
                  1.1 Customer-Initiated Cancellations
                </h3>
                <p>
                  Orders may be cancelled{" "}
                  <span className="font-bold text-primary underline decoration-primary/30 underline-offset-4">
                    only before dispatch
                  </span>{" "}
                  by contacting Six Yards Love through:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background p-4 rounded-xl border border-border">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                      Email Support
                    </p>
                    <p className="font-semibold text-primary">
                      support@sixyardslove.com
                    </p>
                    <p className="font-semibold text-primary">
                      sales@sixyardslove.com
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                      Phone Support
                    </p>
                    <p className="font-semibold text-primary">
                      +91 00000 00000
                    </p>
                  </div>
                </div>
                <p className="text-sm bg-amber-50 text-amber-900 p-3 rounded-lg border border-amber-100 italic">
                  Note: Once an order has been dispatched, cancellation is not
                  permitted. Such orders may only be eligible for return in
                  accordance with Section 2.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">
                  1.2 Cancellation by Six Yards Love
                </h3>
                <p>
                  Six Yards Love reserves the right to cancel any order at its sole
                  discretion in the following circumstances:
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Product unavailability / inventory discrepancies",
                    "Errors in pricing or descriptions",
                    "Suspected fraudulent transactions",
                    "Non-serviceable delivery regions",
                    "Events beyond reasonable control (Force Majeure)",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-foreground/80 bg-white p-3 rounded-lg border border-border/50 shadow-sm"
                    >
                      <span className="h-2 w-2 rounded-full bg-secondary mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary text-2xl">02.</span> Return Policy
            </h2>

            <div className="space-y-10 ml-4">
              <div className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                    A
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Sarees & Apparel
                  </h3>
                </div>
                <p className="text-sm italic text-muted-foreground">
                  (Including sarees, blouses, and accessories)
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-primary flex items-center gap-2 underline underline-offset-4 decoration-primary/20">
                      1. Eligible Return Reasons
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex gap-2">
                        <span className="text-secondary font-bold">•</span>{" "}
                        Product damaged during transit
                      </li>
                      <li className="flex gap-2">
                        <span className="text-secondary font-bold">•</span>{" "}
                        Manufacturing defect (tears, pulled threads, stains)
                      </li>
                      <li className="flex gap-2">
                        <span className="text-secondary font-bold">•</span>{" "}
                        Incorrect item or colour delivered
                      </li>
                      <li className="flex gap-2">
                        <span className="text-secondary font-bold">•</span>{" "}
                        Product significantly different from its description
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-primary flex items-center gap-2 underline underline-offset-4 decoration-primary/20">
                      2. Reporting Timeline
                    </h4>
                    <div className="space-y-3">
                      <p className="text-sm">
                        <span className="font-bold text-foreground underline decoration-secondary">
                          48 Hours:
                        </span>{" "}
                        Report all issues within 48 hours of delivery.
                      </p>
                      <p className="text-sm">
                        <span className="font-bold text-foreground underline decoration-secondary">
                          Tags Intact:
                        </span>{" "}
                        The saree must be unworn with original tags attached.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                  <h4 className="font-bold text-primary mb-4 underline underline-offset-4 decoration-primary/20">
                    4. Mandatory Proof for Claims
                  </h4>
                  <p className="text-sm mb-4">
                    To prevent misuse, a clear{" "}
                    <span className="font-black italic px-1 bg-yellow-100">
                      unboxing video
                    </span>{" "}
                    or photo evidence is mandatory showing:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      "Packaging condition",
                      "Tags & labels",
                      "Observed defect",
                    ].map((item, i) => (
                      <span
                        key={i}
                        className="text-xs font-bold px-3 py-1 bg-secondary/5 text-secondary border border-secondary/10 rounded-full"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                    B
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    General Conditions
                  </h3>
                </div>
                <p className="text-sm italic text-muted-foreground">
                  (Customised items such as fall-pico or stitched blouses are
                  not eligible for return)
                </p>
                <div className="bg-secondary/5 p-4 rounded-xl border border-secondary/10">
                  <p className="text-sm font-semibold text-secondary">
                    Returns are accepted within 7 days of delivery.
                  </p>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Products must be{" "}
                  <span className="font-bold underline decoration-secondary/30">
                    unworn, unwashed, and unaltered
                  </span>{" "}
                  with original packaging, labels, and tags intact.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary text-2xl">03.</span> Refund Policy
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-4">
              <div className="p-6 bg-white rounded-2xl border border-border shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">
                  3.1 Refund Processing
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Refunds will be initiated within{" "}
                  <span className="font-bold text-primary">
                    7–10 business days
                  </span>{" "}
                  after the returned product is received and verified.
                </p>
                <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                  Note: Credits are made only to the original mode of payment.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-border shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">
                  3.2 Refund Amount
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  A{" "}
                  <span className="font-bold text-emerald-700">
                    full refund
                  </span>
                  , including shipping, is issued for defective or damaged
                  products.
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  For customer-initiated returns,{" "}
                  <span className="font-bold text-rose-700 underline decoration-rose-200">
                    shipping charges are non-refundable
                  </span>
                  .
                </p>
              </div>
            </div>
          </section>

          <div className="p-10 bg-primary/5 rounded-[2.5rem] border border-primary/10 text-center space-y-4">
            <p className="text-xs uppercase tracking-widest font-bold text-primary/60">
              Need Assistance?
            </p>
            <h2 className="text-3xl font-display font-bold text-primary">
              Contact Our Support Team
            </h2>
            <div className="flex flex-wrap justify-center gap-8 pt-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Email
                </p>
                <a
                  href="mailto:support@sixyardslove.com"
                  className="text-lg font-bold text-primary hover:text-secondary transition-colors underline underline-offset-4 decoration-primary/20"
                >
                  support@sixyardslove.com
                </a>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Phone
                </p>
                <p className="text-lg font-bold text-primary">
                  +91 00000 00000
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground pt-4 border-t border-primary/10 max-w-lg mx-auto italic">
              Business Hours: Monday to Saturday, 10:00 AM – 6:00 PM (IST)
            </p>
          </div>
        </div>
      }
    />
  );
};

export default Refunds;
