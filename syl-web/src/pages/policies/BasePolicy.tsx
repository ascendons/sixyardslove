import { Layout } from "@/components/layout";
import { PageHero } from "@/components/common/PageHero";
import { ShieldCheck, LucideIcon } from "lucide-react";

interface BasePolicyProps {
  title: string;
  icon: LucideIcon;
  content: React.ReactNode;
  lastUpdated: string;
}

export const BasePolicy = ({
  title,
  icon: Icon,
  content,
  lastUpdated,
}: BasePolicyProps) => {
  return (
    <Layout>
      <PageHero
        eyebrow="Policy Document"
        title={title}
        subtitle={`Last updated: ${lastUpdated}`}
      >
        <div className="mt-8 inline-flex items-center justify-center w-14 h-14 rounded-full border border-secondary/40 text-secondary">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
      </PageHero>

      <section className="py-12 md:py-20 bg-background/50">
        <div className="container-institutional">
          <div className="max-w-[1500px] mx-auto">
            <div className="bg-card p-8 md:p-16 rounded-[2rem] border border-border shadow-xl shadow-forest/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Icon size={200} />
              </div>

              <div className="relative z-10">
                <div className="prose-institutional prose-headings:font-display prose-headings:text-primary prose-p:text-foreground/80 prose-strong:text-primary prose-a:text-secondary hover:prose-a:text-secondary-dark transition-colors">
                  {content}
                </div>

                <div className="mt-16 pt-10 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold text-primary tracking-wide">
                      Six Yards Love Official Policy
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    &copy; {new Date().getFullYear()} Six Yards Love
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};
