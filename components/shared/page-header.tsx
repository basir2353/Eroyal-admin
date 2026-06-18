import { Header } from "@/components/layout/header";

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return <Header title={title} description={description} />;
}
