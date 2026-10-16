import { FileText } from "lucide-react";
import { BasePolicy } from "./BasePolicy";

const Terms = () => {
  return (
    <BasePolicy
      title="Terms of Service"
      icon={FileText}
      lastUpdated="January 2026"
      content={
        <div className="space-y-12">
          <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
            <p className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Effective Date: January 27, 2026
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              Legal Entity:{" "}
              <span className="font-semibold text-foreground">
                [SYL legal entity TBD]
              </span>
            </p>
          </div>

          <p className="text-lg text-foreground/80 leading-relaxed italic border-l-4 border-secondary pl-6">
            These Terms of Service (“Terms”) constitute a legally binding
            agreement between you and [SYL legal entity TBD],
            governing your access to and use of our platform.
          </p>

          <section className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
                  <span className="text-secondary">01.</span> Company
                  Information
                </h2>
                <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                      Registered Office
                    </p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      
                      <br />
                      [SYL address TBD]
                      <br />
                      
                    </p>
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                      Contact
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      customer-support@sixyardslove.com
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      +91 00000 00000
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
                  <span className="text-secondary">02.</span> Nature of Business
                </h2>
                <div className="bg-secondary/5 p-6 rounded-2xl border border-secondary/10 h-full">
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Six Yards Love operates an{" "}
                    <span className="font-bold text-secondary">
                      inventory-based e-commerce model
                    </span>
                    , as defined under the Consumer Protection (E-Commerce)
                    Rules, 2020. Products sold are owned, stocked, and sold
                    directly by the Company.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">03.</span> Products Offered
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-2xl border border-border shadow-sm space-y-3">
                <h3 className="font-bold text-foreground text-lg">
                  Sarees
                </h3>
                <p className="text-sm text-muted-foreground">
                  Silk, cotton, handloom, and designer sarees for every
                  occasion.
                </p>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-border shadow-sm space-y-3">
                <h3 className="font-bold text-foreground text-lg">
                  Blouses & Accessories
                </h3>
                <p className="text-sm text-muted-foreground">
                  Blouses, falls, and accessories that complete the look.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">04.</span> Eligibility &
              Obligations
            </h2>
            <div className="space-y-4 ml-4">
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-xs font-bold text-primary">18+</span>
                </div>
                <p className="text-sm text-foreground/80">
                  Users must be at least{" "}
                  <span className="font-bold">18 years of age</span> or use the
                  platform under parental/guardian supervision.
                </p>
              </div>
              <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-3">
                  Prohibited Activities
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {[
                    "Fraud & Deceptive practices",
                    "Intellectual property infringement",
                    "Unauthorized system access",
                    "Reselling without authorization",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="text-sm text-rose-900 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 rounded-full bg-rose-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">05.</span> Pricing & Payment
            </h2>
            <div className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <h3 className="font-bold text-primary">Currency & Taxes</h3>
                  <p className="text-sm text-foreground/70">
                    All prices are in <span className="font-bold">INR</span> and
                    inclusive of applicable taxes.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-primary">Security</h3>
                  <p className="text-sm text-foreground/70">
                    Payments are processed via{" "}
                    <span className="font-bold underline decoration-secondary/30">
                      PCI-DSS compliant gateways
                    </span>
                    . We do not store card credentials.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary">06.</span> Grievance Redressal
            </h2>
            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 space-y-6 relative overflow-hidden">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-primary/60 uppercase">
                    Designation
                  </p>
                  <p className="text-lg font-bold text-primary">
                    Admin Officer
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-primary/60 uppercase">
                    Resolution Timeline
                  </p>
                  <p className="text-lg font-bold text-primary">
                    Within 30 Days
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-primary/60 uppercase">
                    Contact
                  </p>
                  <p className="text-lg font-bold text-primary">
                    support@sixyardslove.com
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="pt-10 border-t border-border/40 text-center">
            <p className="text-sm text-muted-foreground">
              By using our website, you confirm that you have read, understood,
              and agreed to these Terms.
            </p>
          </div>
        </div>
      }
    />
  );
};

export default Terms;
