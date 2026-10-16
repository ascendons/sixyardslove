import { Truck } from "lucide-react";
import { BasePolicy } from "./BasePolicy";

const Shipping = () => {
  return (
    <BasePolicy
      title="Shipping and Delivery Policy"
      icon={Truck}
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
                POL-SD-BBE-002
              </span>
            </p>
          </div>

          <p className="text-xl text-foreground font-medium leading-relaxed italic border-l-4 border-secondary pl-6">
            This Shipping and Delivery Policy applies to all orders placed on
            the Six Yards Love e-commerce platform. By placing an order, you agree to
            the terms outlined below.
          </p>

          <section className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary text-2xl">01.</span> Shipping
              Coverage
            </h2>
            <div className="ml-4 space-y-4">
              <p className="text-lg text-foreground/80">
                Six Yards Love currently delivers{" "}
                <span className="font-bold text-primary italic underline decoration-primary/20">
                  across India (Pan-India)
                </span>{" "}
                to all serviceable pin codes through authorized logistics
                partners.
              </p>
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                Delivery availability is subject to courier network coverage and
                regulatory or operational constraints.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary text-2xl">02.</span> Shipping
              Charges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col justify-center items-center text-center">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                  Benefit
                </p>
                <h3 className="text-2xl font-bold text-emerald-900">
                  Free Shipping
                </h3>
                <p className="text-emerald-700 font-medium">On all orders</p>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-border shadow-sm">
                <h3 className="text-lg font-bold text-foreground mb-3">
                  Standard Shipping
                </h3>
                <p className="text-sm text-foreground/70">
                  Flexible shipping options available based on product quantity,
                  size, and condition.
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic ml-4">
              * Remote or difficult-to-access locations may incur additional
              charges.
            </p>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary text-2xl">03.</span> Delivery
              Timelines
            </h2>

            <div className="space-y-8 ml-4">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  3.1 Order Processing Time
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm">
                    <span className="font-bold text-primary min-w-[120px]">
                      Standard:
                    </span>
                    <span>
                      Orders are processed within{" "}
                      <span className="font-bold text-foreground underline decoration-secondary/30">
                        4–5 business days
                      </span>{" "}
                      after payment.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <span className="font-bold text-primary min-w-[120px]">
                      Holidays:
                    </span>
                    <span>
                      Orders placed on weekends or public holidays are processed
                      on the next business day.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  3.2 Estimated Delivery Time
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { area: "Metro Cities", time: "3–5 Days" },
                    { area: "Other Cities", time: "5–7 Days" },
                    { area: "Remote Areas", time: "7–10 Days" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-white p-4 rounded-xl border border-border shadow-sm text-center"
                    >
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-1">
                        {item.area}
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {item.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
              <span className="text-secondary text-2xl">04.</span> Order
              Dispatch & Tracking
            </h2>
            <div className="ml-4 p-6 bg-secondary/5 rounded-2xl border border-secondary/10 flex flex-col md:flex-row gap-6 items-center">
              <div className="space-y-2 flex-1">
                <p className="text-sm leading-relaxed">
                  Once your order is dispatched, you will receive tracking
                  details via{" "}
                  <span className="font-bold underline decoration-secondary">
                    email and SMS
                  </span>
                  .
                </p>
                <p className="text-sm font-medium text-primary">
                  Shipment status can be tracked using the courier tracking link
                  provided.
                </p>
              </div>
              <div className="shrink-0">
                <span className="px-6 py-2 bg-primary text-white font-bold rounded-full text-sm shadow-lg shadow-primary/20">
                  Track Your Order
                </span>
              </div>
            </div>
          </section>

          <div className="p-10 bg-primary/5 rounded-[2.5rem] border border-primary/10 text-center space-y-4">
            <p className="text-xs uppercase tracking-widest font-bold text-primary/60">
              Shipping Questions?
            </p>
            <h2 className="text-3xl font-display font-bold text-primary">
              Logistics Support
            </h2>
            <div className="flex flex-wrap justify-center gap-8 pt-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Email
                </p>
                <a
                  href="mailto:support@sixyardslove.com"
                  className="text-lg font-bold text-primary"
                >
                  support@sixyardslove.com
                </a>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Hotline
                </p>
                <p className="text-lg font-bold text-primary">
                  +91 00000 00000
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground pt-4 border-t border-primary/10 max-w-lg mx-auto italic">
              Our delivery partners are committed to bringing your sarees to
              you safely and efficiently.
            </p>
          </div>
        </div>
      }
    />
  );
};

export default Shipping;
