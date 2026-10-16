import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Product } from "@/data/products";
import * as Modules from "@/components/admin/AdminModules";

interface DashboardOverviewProps {
  products: Product[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  products,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
    <Card className="border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Total Products
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{products.length}</div>
      </CardContent>
    </Card>
    <Card className="border-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Featured
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {products.filter((p) => p.featured).length}
        </div>
      </CardContent>
    </Card>
    <Card className="border-2 text-primary bg-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wider">
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Synced
        </div>
      </CardContent>
    </Card>
    <div className="md:col-span-3">
      <Modules.AnalyticsView />
    </div>
  </div>
);
