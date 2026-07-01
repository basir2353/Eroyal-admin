import { PageHeader } from "@/components/shared/page-header";
import { CarouselEditorLazy } from "@/components/cms/carousel-editor-lazy";

export default function CarouselPage() {
  return (
    <div>
      <PageHeader
        title="Carousel Banners"
        description="Upload image files or paste direct image URLs. Recommended size: 1024 x 320 px (3.2:1)."
      />
      <div className="admin-content">
        <CarouselEditorLazy />
      </div>
    </div>
  );
}
