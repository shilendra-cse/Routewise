export type NavItem = {
  title: string;
  href: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const docsNavigation: NavSection[] = [
  {
    title: "Getting started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Quick start", href: "/docs/quick-start" },
      { title: "Project layout", href: "/docs/project-layout" },
    ],
  },
  {
    title: "Core concepts",
    items: [
      { title: "Routing", href: "/docs/routing" },
      { title: "Context object", href: "/docs/context" },
      { title: "Middleware", href: "/docs/middleware" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Feature reference", href: "/docs/reference" },
      { title: "Development", href: "/docs/development" },
    ],
  },
];

export const siteLinks = [
  { title: "Docs", href: "/docs" },
  { title: "GitHub", href: "https://github.com/shilendra-cse/Routewise" },
];
