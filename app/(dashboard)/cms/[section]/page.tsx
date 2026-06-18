"use client";

import { use } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { CmsEditor } from "@/components/cms/cms-editor";

const cmsConfig: Record<
  string,
  {
    title: string;
    description: string;
    fields: {
      key: string;
      label: string;
      type: "text" | "textarea" | "url" | "boolean" | "json";
      hint?: string;
    }[];
  }
> = {
  hero: {
    title: "Hero Section",
    description: "Main homepage banner text and call-to-action.",
    fields: [
      { key: "eyebrow", label: "Eyebrow Text", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "titleHighlight", label: "Highlighted Word", type: "text", hint: "Shown in yellow accent color." },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "inlineStats", label: "Inline Stats", type: "json", hint: "JSON array: [{ \"value\": \"100%\", \"label\": \"Export Quality\" }]" },
      { key: "buttonText", label: "Button Text", type: "text" },
      { key: "buttonLink", label: "Button Link", type: "url" },
      { key: "isVisible", label: "Section Visibility", type: "boolean" },
    ],
  },
  benefits: {
    title: "Benefits Section",
    description: "Three benefit cards shown on the homepage.",
    fields: [
      { key: "sectionTitle", label: "Section Title", type: "text" },
      { key: "cards", label: "Benefit Cards", type: "json", hint: "JSON array with title, description, and icon name." },
      { key: "isVisible", label: "Section Visibility", type: "boolean" },
    ],
  },
  gallery: {
    title: "Mango Gallery",
    description: "Category gallery images on the homepage.",
    fields: [
      { key: "items", label: "Gallery Items", type: "json", hint: "JSON array with title, image URL, and link." },
      { key: "isVisible", label: "Section Visibility", type: "boolean" },
    ],
  },
  promo: {
    title: "Promotional Banner",
    description: "Large promo strip with background image.",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "buttonText", label: "Button Text", type: "text" },
      { key: "buttonLink", label: "Button Link", type: "url" },
      { key: "backgroundImage", label: "Background Image URL", type: "url", hint: "Upload in Media Library and paste URL here." },
      { key: "isVisible", label: "Section Visibility", type: "boolean" },
    ],
  },
  stats: {
    title: "Statistics Section",
    description: "Numbers displayed on the homepage.",
    fields: [
      { key: "customersCommunity", label: "Customers Community", type: "text" },
      { key: "satisfactionRate", label: "Satisfaction Rate", type: "text" },
      { key: "yearsInBusiness", label: "Years In Business", type: "text" },
      { key: "countriesShipped", label: "Countries Shipped", type: "text" },
      { key: "isVisible", label: "Section Visibility", type: "boolean" },
    ],
  },
  contactCta: {
    title: "Contact CTA",
    description: "Call-to-action block before the footer.",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "buttonText", label: "Button Text", type: "text" },
      { key: "buttonLink", label: "Button Link", type: "url" },
      { key: "isVisible", label: "Section Visibility", type: "boolean" },
    ],
  },
  about: {
    title: "About Page",
    description: "Story, services, and process content for the About page.",
    fields: [
      { key: "storyTitle", label: "Story Title", type: "text" },
      { key: "storyParagraphs", label: "Story Paragraphs", type: "json", hint: "JSON array of paragraph strings." },
      { key: "heroImage", label: "Hero Image URL", type: "url", hint: "Main image on the About page." },
      { key: "services", label: "Services", type: "json", hint: "JSON array: [{ \"title\": \"...\", \"description\": \"...\" }]" },
      { key: "exportProcess", label: "Export Process", type: "json" },
      { key: "packagingProcess", label: "Packaging Process", type: "json" },
      { key: "isVisible", label: "Page Active", type: "boolean" },
    ],
  },
  contactPage: {
    title: "Contact Page",
    description: "Intro text and address shown on the contact page.",
    fields: [
      { key: "intro", label: "Intro Text", type: "textarea" },
      { key: "address", label: "Business Address", type: "text", hint: "Also used in footer contact details." },
      { key: "isVisible", label: "Page Active", type: "boolean" },
    ],
  },
};

export default function CmsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = use(params);
  const config = cmsConfig[section];

  if (!config) {
    return (
      <div>
        <PageHeader title="CMS Section" />
        <div className="admin-content text-muted-foreground">Invalid CMS section.</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={config.title} description={config.description} />
      <div className="admin-content">
        <CmsEditor
          section={section}
          title={config.title}
          description={config.description}
          fields={config.fields}
        />
      </div>
    </div>
  );
}
