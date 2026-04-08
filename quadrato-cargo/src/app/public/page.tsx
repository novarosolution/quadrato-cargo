import type { Metadata } from "next";
import HomeView from "@/components/home/HomeMain";
import { siteDescription, siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: siteName },
  description: siteDescription,
};

export default function Home() {
  return <HomeView />;
}
