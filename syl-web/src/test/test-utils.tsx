import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, MemoryRouterProps } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

const AllTheProviders = ({
  children,
  route = "/",
  initialEntries,
}: {
  children: React.ReactNode;
  route?: string;
  initialEntries?: MemoryRouterProps["initialEntries"];
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const entries = initialEntries ?? [route];
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={entries} initialIndex={0}>
          {children}
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & {
    route?: string;
    initialEntries?: MemoryRouterProps["initialEntries"];
  },
) {
  const { route = "/", initialEntries, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders route={route} initialEntries={initialEntries}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
}

export * from "@testing-library/react";
export { customRender as render };
