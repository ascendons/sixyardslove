import { Layout } from "@/components/layout";
import { PageHero } from "@/components/common/PageHero";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Eye, Sparkles, Gem, Heart, Truck } from "lucide-react";
import { MISSION, VISION } from "@/content/brand";

const values = [
  {
    icon: Sparkles,
    title: "Handpicked",
    description:
      "Every saree is personally chosen for its weave, colour, and drape.",
  },
  {
    icon: Gem,
    title: "Authentic",
    description:
      "Honest descriptions of every fabric, so you know exactly what you're buying.",
  },
  {
    icon: Heart,
    title: "Made to be Loved",
    description:
      "Sarees you'll reach for again and again, and pass on with pride.",
  },
  {
    icon: Truck,
    title: "Delivered with Care",
    description:
      "Thoughtfully packed and shipped across India, with easy returns.",
  },
];

const steps = [
  {
    title: "We Curate",
    description:
      "We travel through India's weaving traditions to find sarees worth wearing.",
  },
  {
    title: "We Check",
    description:
      "Each piece is inspected for fabric, finish, and colour before it's listed.",
  },
  {
    title: "We Deliver",
    description:
      "Your saree is packed with care and delivered to your doorstep.",
  },
];

const About = () => {
  return (
    <Layout>
      <PageHero
        eyebrow="About Six Yards Love"
        title={
          <>
            Six Yards. <span className="italic text-gold-foil">Endless Love.</span>
          </>
        }
        subtitle="Six Yards Love is a saree label for women who love the drape. We bring together handpicked sarees, from everyday cottons to occasion silks, chosen for their weave, colour, and finish."
      />

      {/* Mission & Vision */}
      <section className="section-padding bg-background">
        <div className="container-institutional">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="bg-card rounded-2xl p-8 md:p-10 border border-border">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed">{MISSION}</p>
            </div>

            <div className="bg-secondary/5 rounded-2xl p-8 md:p-10 border border-secondary/20">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center mb-6">
                <Eye className="h-6 w-6 text-secondary" />
              </div>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                Our Vision
              </h2>
              <p className="text-muted-foreground leading-relaxed">{VISION}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How we work */}
      <section className="section-padding bg-secondary/5">
        <div className="container-institutional">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-foreground mb-6">From Loom to You</h2>
            <p className="prose-institutional mx-auto">
              Every saree in our collection goes through the same careful
              journey before it reaches you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-display font-bold text-primary">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-background">
        <div className="container-institutional">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className="text-foreground mb-6">What We Stand For</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-6 w-6 text-secondary-foreground" />
                </div>
                <h4 className="font-display font-semibold text-foreground mb-2">
                  {value.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-secondary">
        <div className="container-institutional text-center">
          <h2 className="text-secondary-foreground mb-4">Find Your Drape</h2>
          <p className="text-secondary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
            Explore the collection, or reach out and we'll help you pick the
            perfect saree.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop">
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-ochre-dark"
              >
                Shop Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
