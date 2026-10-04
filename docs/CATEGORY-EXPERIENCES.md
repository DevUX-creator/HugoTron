# Category experiences

Seven category pages share the World frame, catalogue and enquiry controls. Their paper chapters use original category illustrations, independently positioned within each chapter. They do not load the home's pinned engraving plane, illustration filters or unrelated films.

| Range         | Scene interaction                                                                                      | Paper illustrations                   |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| Rice          | Original ceramic bowl; lift grains, scroll into an overhead view, brush with mouse/touch or arrow keys | Rice panicles and terraced fields     |
| Nuts          | Hinged pistachio shells open around the kernel; orbit widens                                           | Nut-bearing branches and orchard      |
| Spices        | A loose, stirring movement through the botanicals                                                      | Ginger, cinnamon and cardamom studies |
| Saffron       | Fine threads fan out and turn                                                                          | Crocus and a thread study             |
| Pulses        | Local ripple around the pointer                                                                        | Pods, plants and harvested pulses     |
| Tea           | Leaves drift and turn as if in a gentle current                                                        | Tea branch and hillside garden        |
| Raw materials | Rolling wave through the grains                                                                        | Cereal stalks and mill                |

Each courtyard presentation has a small lighting and camera variation. These settings are opt-in: the home keeps its existing presentation. Every interaction also has a button, so it does not depend on hover. Reduced motion keeps a static presentation. Category copy, links and buying controls are server-rendered and available without WebGL.

The footer grows an irregular, spatially warped opening from the right. It does not clip the reveal with a moving straight edge. The tail stays within the canvas; mobile and reduced motion show the finished torn opening. The additional reveal field is skipped once fully open.

## Assets

15 original transparent illustrations were generated with the built-in image generation tool and optimized with Sharp to WebP (about 4.3 MB across all seven categories). Each page uses only its own pair plus the shared logistics drawing. Illustrations are editorial, not photographs of specific supplier locations.

- Assets: `public/images/category-editorial/`
- Exact prompts, source files, dimensions and output files: `content/_source/images/category-editorial/prompts.json`
- Chapter layouts, accent colours and relevant films: `src/content/categoryStories.ts`

Rice and tea use their existing relevant films. The other ranges use their illustrations; no unrelated home footage is substituted.

## Lifecycle and checks

Courtyard pages prepare only the selected ingredient. The rice renderer sleeps once paper covers it and explicitly releases its WebGL context on unmount. Scroll/parallax updates settle instead of running a permanent story animation loop. Product rails share the existing native touch behaviour and bounded mouse glide.

`node scripts/check-category-pages.mjs [base] [chromium|webkit]` covers all seven ranges in English desktop and German mobile layouts: activation, overhead rice brushing, paper contrast, buying/enquiry controls, rail navigation, footer clearance and release of all owned rendering contexts during SPA navigation.

Related regression checks: `scripts/check-mobile-range.mjs` and `scripts/check-world-lifecycle.mjs`.
