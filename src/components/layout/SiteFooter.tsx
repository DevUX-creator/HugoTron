import PaperContact from "@/sections/Daylight/PaperContact";
import "@/sections/Daylight/daylight.css";
import "@/sections/Daylight/story.css";

/**
 * The home's footer (call to action with the cube, products, business links, quick contact,
 * legal) for pages outside the story: shop, account, contact. The wrapper supplies the story
 * scope its styles expect.
 */
export default function SiteFooter() {
  return (
    <div className="paper-story site-footer">
      <PaperContact />
    </div>
  );
}
