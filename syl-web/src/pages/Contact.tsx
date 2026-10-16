import { Layout } from "@/components/layout";
import { PageHero } from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Mail, Phone, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import contactService from "@/services/contactService";
import { Loader2 } from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactService.sendMessage(formData);
      toast({
        title: "Message Sent",
        description:
          "Thank you for reaching out. We'll respond within 2-3 business days.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHero
        eyebrow="Contact Us"
        title="Get in Touch"
        subtitle="Have a question about a saree, an order, or a bulk enquiry? We're here to help."
      />

      {/* Contact Info + Form */}
      <section className="section-padding bg-background">
        <div className="container-institutional">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-display font-semibold text-foreground mb-8">
                Contact Information
              </h2>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Head Office
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      [SYL legal entity TBD]
                      <br />
                      [SYL address TBD]
                      <br />
                      Rajasthan, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Email
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      customer-support@sixyardslove.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Phone
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      +91 00000 00000
                      <br />
                      Mon-Sat, 9:00 AM - 6:00 PM IST
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      Response Time
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      We typically respond within
                      <br />
                      2-3 business days
                    </p>
                  </div>
                </div>
              </div>

              {/* Regional Offices Placeholder */}
              <div className="mt-12 pt-8 border-t border-border">
                <h4 className="font-semibold text-foreground mb-4">
                  Regional Presence
                </h4>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      Head Office (North)
                    </p>
                    <p className="text-muted-foreground">
                      [SYL address TBD]
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">South Region</p>
                    <p className="text-muted-foreground">
                      2nd Floor, Athreya Apartment,
                      <br />
                      28/5, 18th Cross Road, Malleshwaram,
                      <br />
                      Bengaluru – 560055, KA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl p-6 md:p-8 border border-border">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-6">
                  Send Us a Message
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <select
                      id="subject"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="products">Product Information</option>
                      <option value="orders">Order Support</option>
                      <option value="bulk">Bulk / Wedding Orders</option>
                      <option value="media">Media / Press</option>
                      <option value="careers">Careers</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message *</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Tell us how we can help..."
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-ochre-dark"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="section-padding bg-secondary/5">
        <div className="container-institutional">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h2 className="text-foreground mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Quick answers to common questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                q: "How can I order Six Yards Love products?",
                a: "You can browse our product catalog and place orders directly through our platform. For bulk orders, contact our sales team.",
              },
              {
                q: "What is the minimum order quantity?",
                a: "MOQ varies by product category. For retail orders, there's no minimum. For bulk or wedding orders, please contact us for details.",
              },
              {
                q: "Can you help me choose a saree?",
                a: "Of course! Write to us or call us with the occasion and your preferences, and we'll suggest a few options.",
              },
              {
                q: "Do you ship internationally?",
                a: "Currently, we primarily serve the Indian market. For international inquiries, please contact us directly.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="bg-card rounded-lg p-6 border border-border"
              >
                <h4 className="font-semibold text-foreground mb-2">{faq.q}</h4>
                <p className="text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
