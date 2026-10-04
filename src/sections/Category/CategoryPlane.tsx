import Image from "next/image";
import type { CategoryStory, StoryChapter } from "@/content/categoryStories";

/** Two original engravings share a reading composition. No SVG filters or animation loops. */
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
      <svg className="category-art__orbit" viewBox="0 0 1000 650" fill="none">
        <path d="M24 510C-10 370 230 240 542 214S1012 106 964 42M56 556C316 632 750 524 914 350" />
      </svg>
    </div>
  );
}
