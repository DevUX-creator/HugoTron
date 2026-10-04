"""Build the small, static Germany map from Natural Earth 1:50m country outlines.

Source (public domain):
https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
Usage: python3 scripts/build-delivery-map.py countries.geojson states.geojson roads.geojson [GRAY_HR_SR.zip]
No map SDK, tiles, network request or geography package is needed at runtime.
"""

import json
import math
import sys
from pathlib import Path

COUNTRIES = {"DEU", "DNK", "NLD", "BEL", "LUX", "FRA", "CHE", "AUT", "CZE", "POL",
             "ITA", "SVK", "HUN", "SVN", "HRV", "GBR", "SWE", "NOR", "LTU"}


def project(point):
    lon, lat = point
    return [round(600 + (lon - 10.45) * math.cos(math.radians(51)) * 80, 2),
            round(480 - (lat - 51.16) * 80, 2)]


def simplify(points, tolerance):
    if len(points) < 3:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = dx * dx + dy * dy
    farthest, split = 0, 0
    for i, p in enumerate(points[1:-1], 1):
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) if length else 0
        distance = math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
        if distance > farthest:
            farthest, split = distance, i
    if farthest <= tolerance:
        return [a, b]
    return simplify(points[:split + 1], tolerance)[:-1] + simplify(points[split:], tolerance)


def line_path(points, tolerance=0.004):
    return "M" + "L".join(f"{x},{y}" for x, y in map(project, simplify(points, tolerance)))


def build_relief(source):
    # Optional asset preparation only; Pillow is not a site/build dependency.
    # Gray Earth's geographic TIFF has a 1/60-degree pixel step and global extent.
    import zipfile
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = 260000000
    with zipfile.ZipFile(source) as archive, archive.open("GRAY_HR_SR.tif") as terrain:
        image = Image.open(terrain)
        width, height = image.size
        crop = image.crop(tuple(round(n) for n in (
            (5 + 180) / 360 * width, (90 - 56) / 180 * height,
            (16.5 + 180) / 360 * width, (90 - 46) / 180 * height)))
        output = Path(__file__).resolve().parent.parent / "public/images/delivery/germany-relief.webp"
        output.parent.mkdir(parents=True, exist_ok=True)
        crop.save(output, quality=86, method=6)
        print(f"Relief crop: {output.stat().st_size:,} bytes")


def main(source, states_source, roads_source, relief_source=None):
    countries = []
    for feature in json.loads(Path(source).read_text())["features"]:
        code = feature["properties"]["ADM0_A3"]
        if code not in COUNTRIES:
            continue
        geometry = feature["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        paths = []
        for polygon in polygons:
            # Exclude overseas territories and islands outside the European composition.
            if not any(-2 < lon < 25 and 41 < lat < 62 for lon, lat in polygon[0]):
                continue
            for ring in polygon:
                points = simplify(ring, 0.012 if code == "DEU" else 0.025)
                if len(points) < 4:
                    continue
                paths.append("M" + "L".join(f"{x},{y}" for x, y in map(project, points)) + "Z")
        countries.append({"id": code, "outline": "".join(paths)})
    regions = []
    for feature in json.loads(Path(states_source).read_text())["features"]:
        props = feature["properties"]
        if props["adm0_a3"] != "DEU":
            continue
        geometry = feature["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        outline = "".join(line_path(ring, 0.006) + "Z" for polygon in polygons for ring in polygon)
        regions.append({"id": props["iso_3166_2"], "name": props["name"], "outline": outline,
                        "label": project([props["longitude"], props["latitude"]])})
    # Retain the real regional road network, merging paths by visual hierarchy.
    # Germany's SVG clip keeps cross-border roads from lighting neighbouring countries.
    roads = {"major": [], "minor": []}
    for feature in json.loads(Path(roads_source).read_text())["features"]:
        props = feature["properties"]
        if props["type"] == "Ferry Route":
            continue
        geometry = feature["geometry"]
        lines = geometry["coordinates"] if geometry["type"] == "MultiLineString" else [geometry["coordinates"]]
        for line in lines:
            if not any(5.7 < point[0] < 15.3 and 47.2 < point[1] < 55.2 for point in line):
                continue
            roads["major" if props["type"] == "Major Highway" else "minor"].append(line_path(line))
    cities = [("Berlin",13.405,52.52),("Bremen",8.802,53.08),("Hannover",9.733,52.376),
              ("Düsseldorf",6.774,51.227),("Köln",6.96,50.938),("Frankfurt",8.682,50.111),
              ("Leipzig",12.374,51.34),("Dresden",13.737,51.05),("Nürnberg",11.077,49.452),
              ("Stuttgart",9.182,48.776),("München",11.576,48.137)]
    result = {"countries": countries, "regions": regions,
              "roads": {key: "".join(paths) for key, paths in roads.items()},
              "cities": [{"name": name, "point": project([lon,lat])} for name,lon,lat in cities],
              "hamburg": project([9.9937, 53.5511])}
    output = Path(__file__).resolve().parent.parent / "src/content/deliveryMap.ts"
    output.write_text("// Generated by scripts/build-delivery-map.py. Natural Earth, public domain.\n"
                      + "export const DELIVERY_MAP = " + json.dumps(result, separators=(",", ":")) + " as const;\n")
    print(f"{len(countries)} countries, {len(regions)} states; {output.stat().st_size:,} bytes")
    if relief_source:
        build_relief(relief_source)


if __name__ == "__main__":
    main(*sys.argv[1:])
