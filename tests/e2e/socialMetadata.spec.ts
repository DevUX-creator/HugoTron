import { expect, test } from "@playwright/test";

test("sharing crawlers receive localized page artwork and working local icons", async ({
  request,
}) => {
  const routes = [
    ["/en", "en/world"],
    ["/de", "de/world"],
    ["/en/products", "en/products"],
    ["/de/sortiment", "de/products"],
    ["/en/wholesale", "en/wholesale"],
    ["/de/grosshandel", "de/wholesale"],
    ["/en/private-label", "en/private-label"],
    ["/de/private-label", "de/private-label"],
    ["/en/delivery", "en/delivery"],
    ["/de/lieferung", "de/delivery"],
    ["/en/products/rice", "en/products"],
  ];
  for (const [route, image] of routes) {
    const response = await request.get(route!, {
      headers: { "user-agent": "facebookexternalhit/1.1" },
    });
    expect(response.ok(), route).toBe(true);
    const html = (await response.text()).split("</head>")[0]!;
    const expected = `https://www.hugo-tron.com/social/${image}.jpg`;
    expect(
      html.includes(`<meta property="og:image" content="${expected}"`),
      `${route}: Open Graph image`,
    ).toBe(true);
    expect(
      html.includes(`<meta name="twitter:image" content="${expected}"`),
      `${route}: Twitter image`,
    ).toBe(true);
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('rel="icon" href="/icon.png');
    expect(html).toContain('rel="apple-touch-icon"');
    const asset = await request.get(`/social/${image}.jpg`);
    expect(asset.ok()).toBe(true);
    expect(asset.headers()["content-type"]).toContain("image/jpeg");
    expect((await asset.body()).length).toBeLessThan(300_000);
  }
  const icon = await request.get("/icon.png");
  expect(icon.ok()).toBe(true);
  expect([...(await icon.body()).subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
