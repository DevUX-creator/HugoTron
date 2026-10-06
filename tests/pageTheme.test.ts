import { describe, expect, it, vi } from "vitest";
import { createPageThemes } from "../src/components/rice/pageTheme";

describe("page theme ownership during navigation", () => {
  it("ignores a departing story's scroll and cleanup after a light page takes over", () => {
    const apply = vi.fn();
    const themes = createPageThemes(apply);
    const story = themes.createScope();
    const leaveStory = story.activate("dark");
    story.setPaper(true, 1);
    const shop = themes.createScope();
    shop.activate("light");
    apply.mockClear();

    story.setPaper(false, 0);
    leaveStory();
    story.setPaper(true, 1);
    expect(apply).not.toHaveBeenCalled();
  });

  it("never inherits an old page's paper or reveal when entering a dark scene", () => {
    const apply = vi.fn();
    const themes = createPageThemes(apply);
    const home = themes.createScope();
    home.activate("dark");
    home.setPaper(true, 1);
    const hall = themes.createScope();
    hall.activate("dark");
    expect(apply).toHaveBeenLastCalledWith({ theme: "dark", paper: false, leave: null });
    apply.mockClear();
    home.setPaper(true, 0.99);
    expect(apply).not.toHaveBeenCalled();
  });

  it("keeps a new story's paper when the previous page cleans up late", () => {
    const apply = vi.fn();
    const themes = createPageThemes(apply);
    const old = themes.createScope();
    const release = old.activate("dark");
    const next = themes.createScope();
    next.activate("dark");
    next.setPaper(true, 1);
    apply.mockClear();
    release();
    old.setPaper(false);
    expect(apply).not.toHaveBeenCalled();
  });

  it("cleans up idempotently and can reactivate after Strict Mode or browser history", () => {
    const apply = vi.fn();
    const themes = createPageThemes(apply);
    const page = themes.createScope();
    const release = page.activate("dark");
    page.setPaper(true, 1);
    release();
    expect(apply).toHaveBeenLastCalledWith({ theme: undefined, paper: false, leave: null });
    apply.mockClear();
    release();
    page.setPaper(true, 1);
    expect(apply).not.toHaveBeenCalled();
    page.activate("dark");
    expect(apply).toHaveBeenLastCalledWith({ theme: "dark", paper: false, leave: null });
    page.setPaper(true, 1);
    expect(apply).toHaveBeenLastCalledWith({ theme: "light", paper: true, leave: 1 });
  });

  it("does not rewrite the document for unchanged story progress", () => {
    const apply = vi.fn();
    const page = createPageThemes(apply).createScope();
    page.activate("dark");
    page.setPaper(true, 1);
    apply.mockClear();
    for (let i = 0; i < 100; i++) page.setPaper(true, 1);
    expect(apply).not.toHaveBeenCalled();
  });
});
