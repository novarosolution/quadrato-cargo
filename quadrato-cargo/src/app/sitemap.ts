import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  const paths = [
    "",
    "/public/service",
    "/public/book",
    "/public/howwork",
    "/public/price",
    "/public/about",
    "/public/contact",
    "/public/login",
    "/public/register",
  ];

  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified,
    changeFrequency: "monthly",
    priority:
      path === ""
        ? 1
        : path === "/public/login" || path === "/public/register"
          ? 0.5
          : 0.8,
  }));
}
