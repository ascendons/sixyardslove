import { Layout } from "@/components/layout";
import {
  AboutSection,
  QualitySection,
  RangoliHero,
  ExpansionHero,
  B2BBanner,
  FeaturedProductsSection,
  HomeBanner,
  ShortsSection,
} from "@/components/home";

const Index = () => {
  return (
    <Layout>
      <RangoliHero />
      <ExpansionHero />
      <FeaturedProductsSection />
      <HomeBanner />

      <QualitySection />

      <AboutSection />
      <ShortsSection />
      <B2BBanner />
    </Layout>
  );
};

export default Index;
