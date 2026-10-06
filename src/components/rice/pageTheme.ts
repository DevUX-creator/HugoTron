export type PageTheme = "dark" | "light";
type ThemeState = { theme: PageTheme | undefined; paper: boolean; leave: number | null };

/** Only the latest mounted page may colour the document. Story callbacks and cleanup
 * from a departing page must never change the next page's theme or paper transition. */
export function createPageThemes(apply: (state: ThemeState) => void) {
  const pages: { theme: PageTheme; paper: boolean; leave: number | null }[] = [];
  const publish = () => {
    const page = pages.at(-1);
    apply({
      theme: page?.paper ? "light" : page?.theme,
      paper: page?.paper ?? false,
      leave: page?.leave ?? null,
    });
  };

  return {
    createScope() {
      const page = { theme: "dark" as PageTheme, paper: false, leave: null as number | null };
      let active = false;
      return {
        activate(theme: PageTheme) {
          page.theme = theme;
          if (!active) pages.push(page);
          active = true;
          if (pages.at(-1) === page) publish();
          return () => {
            if (!active) return;
            const current = pages.at(-1) === page;
            pages.splice(pages.indexOf(page), 1);
            active = false;
            page.paper = false;
            page.leave = null;
            if (current) publish();
          };
        },
        setPaper(paper: boolean, leave: number | null = null) {
          if (!active || (page.paper === paper && page.leave === leave)) return;
          page.paper = paper;
          page.leave = leave;
          if (pages.at(-1) === page) publish();
        },
      };
    },
  };
}
