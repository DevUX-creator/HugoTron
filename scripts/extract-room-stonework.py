"""Keep three existing home-model pieces and their stone maps in a small, independent GLB."""
import copy
import json
import struct
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = (root / "public/models/world/hugo-world-mobile.glb").read_bytes()
json_size = struct.unpack_from("<I", source, 12)[0]
original = json.loads(source[20:20 + json_size])
binary = source[28 + json_size:]
data = bytearray()
doc = {"asset": {"version": "2.0", "generator": "Hugo home stonework extraction"},
       "extensionsUsed": ["EXT_texture_webp"], "extensionsRequired": ["EXT_texture_webp"],
       "scene": 0, "scenes": [{"nodes": [0, 1, 2]}], "nodes": [], "meshes": [],
       "accessors": [], "bufferViews": [], "images": [], "textures": [],
       "samplers": original["samplers"]}

def view(payload, target=None):
    while len(data) % 4:
        data.append(0)
    result = {"buffer": 0, "byteOffset": len(data), "byteLength": len(payload)}
    if target:
        result["target"] = target
    doc["bufferViews"].append(result)
    data.extend(payload)
    return len(doc["bufferViews"]) - 1

def accessor(index):
    a = copy.deepcopy(original["accessors"][index])
    v = original["bufferViews"][a["bufferView"]]
    width = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}[a["componentType"]]
    width *= {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}[a["type"]]
    start = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    stride = v.get("byteStride", width)
    payload = b"".join(binary[start + i * stride:start + i * stride + width] for i in range(a["count"]))
    a["bufferView"] = view(payload, v.get("target"))
    a.pop("byteOffset", None)
    doc["accessors"].append(a)
    return len(doc["accessors"]) - 1

for name, original_name in [("Courtyard_column", "column1_lambert7_0"),
                            ("Courtyard_slab_a", "pCube19_lambert7_0"),
                            ("Courtyard_slab_b", "pCube11_lambert7_0")]:
    mesh = copy.deepcopy(next(m for m in original["meshes"] if m["name"] == original_name))
    mesh["name"] = name
    for primitive in mesh["primitives"]:
        primitive["attributes"] = {k: accessor(v) for k, v in primitive["attributes"].items()}
        primitive["indices"] = accessor(primitive["indices"])
        primitive["material"] = 0
    doc["nodes"].append({"name": name, "mesh": len(doc["meshes"])})
    doc["meshes"].append(mesh)

# Keep the original colour and normal atlases; the room's stone is uniformly matte.
for i in [0, 2]:
    tex = copy.deepcopy(original["textures"][i])
    old_image = original["images"][tex["extensions"]["EXT_texture_webp"]["source"]]
    v = original["bufferViews"][old_image["bufferView"]]
    offset = v.get("byteOffset", 0)
    image = {"mimeType": old_image["mimeType"], "bufferView": view(binary[offset:offset + v["byteLength"]])}
    tex["extensions"]["EXT_texture_webp"]["source"] = len(doc["images"])
    doc["images"].append(image)
    doc["textures"].append(tex)
material = copy.deepcopy(original["materials"][0])
material["name"] = "Courtyard_rough_stone"
material["normalTexture"]["index"] = 1
material["doubleSided"] = False
material["pbrMetallicRoughness"].pop("metallicRoughnessTexture", None)
material["pbrMetallicRoughness"]["roughnessFactor"] = 0.96
doc["materials"] = [material]
doc["buffers"] = [{"byteLength": len(data)}]
header = json.dumps(doc, separators=(",", ":")).encode()
header += b" " * (-len(header) % 4)
data += b"\0" * (-len(data) % 4)
result = struct.pack("<III", 0x46546C67, 2, 28 + len(header) + len(data))
result += struct.pack("<II", len(header), 0x4E4F534A) + header
result += struct.pack("<II", len(data), 0x004E4942) + data
destination = root / "public/models/private-label/courtyard-stonework.glb"
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_bytes(result)
print(f"{destination.relative_to(root)}: {len(result):,} bytes")
