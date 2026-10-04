import Image from "next/image";
import type { CategoryStory, StoryChapter } from "@/content/categoryStories";

/**
 * A chapter's two studies: a botanical that drifts in close and a landscape that opens as the
 * chapter passes (category.css, driven by the chapter's scroll progress `--p`). Decorative.
 */
export default function CategoryPlane({
  story,
  chapter,
}: {
  story: CategoryStory;
  chapter: StoryChapter;
}) {
  const service = chapter.key === "import" || chapter.key === "distribution";
  return (
    <div className="category-art" aria-hidden="true">
      <figure className="category-art__botanical">
        <Image
          src={story.artwork.botanical}
          alt=""
          width={1024}
          height={1536}
          sizes="(max-width: 767px) 32vw, 28vw"
        />
      </figure>
      <figure className="category-art__landscape">
        <Image
          src={service ? "/images/category-editorial/logistics.webp" : story.artwork.landscape}
          alt=""
          width={1536}
          height={1024}
          sizes="(max-width: 767px) 80vw, 46vw"
        />
      </figure>
    </div>
  );
}
