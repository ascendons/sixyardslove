import { Layout } from "./Layout";
import { UserSidebar } from "./UserSidebar";

interface AccountLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AccountLayout({
  children,
  title,
  subtitle,
}: AccountLayoutProps) {
  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <UserSidebar />
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className="min-h-[400px]">{children}</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
