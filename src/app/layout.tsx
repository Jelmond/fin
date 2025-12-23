import type { Metadata } from "next";
import { Onest } from "next/font/google";

import GlobalStyles, { SmartCSSGrid } from "@/styles";

import { Lvh } from "@/hooks/useLvh";
import { generateMetadata } from "@/utils/generateMetadata";

// import { AnimatedRouterLayout } from "@/layouts/AnimatedRouterLayout/AnimatedRouterLayout";
import { StyledComponentsLayout } from "@/layouts/StyledComponentsLayout";
import { AssetsLoaderLayout } from "@/layouts/AssetsLoaderLayout/AssetsLoaderLayout";
import { CanvasLayout } from "@/layouts/CanvasLayout/CanvasLayout";
import { Cookie } from "@/components/Cookie";
import { ScrollLayout } from "@/layouts/ScrollLayout/ScrollLayout";
import { AnimatedRouterLayout } from "@/layouts/AnimatedRouterLayout/AnimatedRouterLayout";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

export const metadata: Metadata = generateMetadata({
  title: "New Project",
  description: "New Project",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${onest.variable}`} style={{ opacity: 0 }}>
        <StyledComponentsLayout>
          <ScrollLayout>
            <SmartCSSGrid />
            <Lvh />
            <GlobalStyles />
            <AssetsLoaderLayout>
              <Cookie />
              <AnimatedRouterLayout>
                <CanvasLayout>{children}</CanvasLayout>
              </AnimatedRouterLayout>
            </AssetsLoaderLayout>
          </ScrollLayout>
        </StyledComponentsLayout>
      </body>
    </html>
  );
}
