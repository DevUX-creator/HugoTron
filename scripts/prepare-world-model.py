"""Prepare web-only courtyard GLBs; never modify the supplied source.

Requires Pillow. Removes the replaced centre and fully dissolved outer props,
prunes orphan assets, packs mesh accessors and embeds the existing WebP textures.
Run from the repository root: python3 scripts/prepare-world-model.py
"""
from pathlib import Path
import copy
import io
import json
import struct
from PIL import Image

SOURCE = Path("shrine_of_the_oracle.glb")
OUT = Path("public/models/world")
REMOVED_CENTRE = {
    "polySurface101_orb_0", "polySurface101_wire_0", "polySurface101_pottery_0",
}
# Audited world-space bounds: every point is beyond the atmosphere's complete
# fade (radius >= 6.15, or radius >= 5.65 with height <= 0.55). These also cannot
# cast onto the visible centre from the cached key light. Do not remove props
# merely because one resting camera view happens to hide them.
HIDDEN_PERIPHERY = {
    "pCube8_lambert7_0", "pCylinder32_pottery_0", "ivy19_ivy12_0",
    "pCube23_lambert7_0", "pCube25_lambert7_0", "pCube26_lambert7_0",
    "pCube27_lambert7_0", "pCube28_lambert7_0", "pCube29_lambert7_0",
    "ivy35_ivy12_0", "ivy45_ivy12_0",
}
COMPONENT_BYTES = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
COMPONENTS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


def texture_slots(value):
    """The authored core glTF material texture slots, including shared maps."""
    if isinstance(value, dict):
        for key, child in value.items():
            if key.endswith("Texture") and isinstance(child, dict) and "index" in child:
                yield child
            else:
                yield from texture_slots(child)
    elif isinstance(value, list):
        for child in value:
            yield from texture_slots(child)


def compact(document, binary, max_size):
    # This static authored asset has no animation/skin/compression dependencies.
    assert not document.get("animations") and not document.get("skins")
    assert not document.get("extensionsRequired")
    nodes = document["nodes"]
    kept = set()

    def keep_node(index):
        node = nodes[index]
        if node.get("name") in REMOVED_CENTRE | HIDDEN_PERIPHERY:
            return False
        children = [child for child in node.get("children", []) if keep_node(child)]
        if "children" in node:
            node["children"] = children
        if "mesh" not in node and not children:
            return False
        kept.add(index)
        return True

    for scene in document["scenes"]:
        scene["nodes"] = [index for index in scene["nodes"] if keep_node(index)]
    node_indices = sorted(kept)
    node_map = {old: new for new, old in enumerate(node_indices)}
    document["nodes"] = [nodes[index] for index in node_indices]
    for node in document["nodes"]:
        if "children" in node:
            node["children"] = [node_map[index] for index in node["children"]]
    for scene in document["scenes"]:
        scene["nodes"] = [node_map[index] for index in scene["nodes"]]

    def retain(key, used):
        indices = sorted(set(used))
        original = document[key]
        document[key] = [original[index] for index in indices]
        return {old: new for new, old in enumerate(indices)}

    mesh_map = retain("meshes", (node["mesh"] for node in document["nodes"] if "mesh" in node))
    for node in document["nodes"]:
        if "mesh" in node:
            node["mesh"] = mesh_map[node["mesh"]]
    primitives = [primitive for mesh in document["meshes"] for primitive in mesh["primitives"]]
    assert all(not p.get("targets") and not p.get("extensions") for p in primitives)
    material_map = retain("materials", (p["material"] for p in primitives))
    for primitive in primitives:
        primitive["material"] = material_map[primitive["material"]]
    slots = list(texture_slots(document["materials"]))
    texture_map = retain("textures", (slot["index"] for slot in slots))
    for slot in slots:
        slot["index"] = texture_map[slot["index"]]
    image_map = retain("images", (texture["source"] for texture in document["textures"]))
    for texture in document["textures"]:
        texture["source"] = image_map[texture["source"]]
    sampler_map = retain("samplers", (t["sampler"] for t in document["textures"] if "sampler" in t))
    for texture in document["textures"]:
        if "sampler" in texture:
            texture["sampler"] = sampler_map[texture["sampler"]]

    index_accessors = {p["indices"] for p in primitives if "indices" in p}
    used_accessors = index_accessors | {index for p in primitives for index in p["attributes"].values()}
    accessor_map = retain("accessors", used_accessors)
    for primitive in primitives:
        primitive["attributes"] = {key: accessor_map[index] for key, index in primitive["attributes"].items()}
        if "indices" in primitive:
            primitive["indices"] = accessor_map[primitive["indices"]]
    index_accessors = {accessor_map[index] for index in index_accessors}
    original_views = document["bufferViews"]
    output = bytearray()
    views = []

    def append(payload, target=None):
        output.extend(b"\0" * (-len(output) % 4))
        view = {"buffer": 0, "byteOffset": len(output), "byteLength": len(payload)}
        if target is not None:
            view["target"] = target
        views.append(view)
        output.extend(payload)
        return len(views) - 1

    # Pack only live accessor slices. Original buffer views also contain geometry
    # from removed meshes; retaining a whole view would retain that download.
    for index, accessor in enumerate(document["accessors"]):
        assert "sparse" not in accessor and accessor["type"] in COMPONENTS
        view = original_views[accessor["bufferView"]]
        size = COMPONENT_BYTES[accessor["componentType"]] * COMPONENTS[accessor["type"]]
        stride = view.get("byteStride", size)
        offset = view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
        payload = b"".join(binary[offset + i * stride:offset + i * stride + size] for i in range(accessor["count"]))
        if index in index_accessors and accessor["componentType"] == 5125:
            values = struct.unpack("<" + "I" * accessor["count"], payload)
            if max(values, default=0) < 65536:
                payload = struct.pack("<" + "H" * len(values), *values)
                accessor["componentType"] = 5123
        accessor["bufferView"] = append(payload, view.get("target"))
        accessor.pop("byteOffset", None)

    for image in document["images"]:
        view = original_views[image["bufferView"]]
        offset = view.get("byteOffset", 0)
        picture = Image.open(io.BytesIO(binary[offset:offset + view["byteLength"]]))
        picture = picture.convert("RGBA" if "A" in picture.getbands() else "RGB")
        picture.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        encoded = io.BytesIO()
        picture.save(encoded, "WEBP", quality=90, method=6)
        image["bufferView"] = append(encoded.getvalue())
        image["mimeType"] = "image/webp"
    for texture in document["textures"]:
        texture["extensions"] = {"EXT_texture_webp": {"source": texture.pop("source")}}
    document["bufferViews"] = views
    document["extensionsUsed"] = ["EXT_texture_webp"]
    document["extensionsRequired"] = ["EXT_texture_webp"]
    document["asset"].setdefault("extras", {})["modifications"] = (
        "Central orb, hanging bowl, ropes and fully dissolved outer props removed; "
        "orphan assets pruned; mesh data packed with lossless 16-bit indices; WebP textures."
    )
    document["buffers"] = [{"byteLength": len(output)}]
    return document, output


def prepare(max_size, filename):
    raw = SOURCE.read_bytes()
    json_length = struct.unpack_from("<I", raw, 12)[0]
    document = json.loads(raw[20:20 + json_length])
    binary = raw[28 + json_length:]
    document, output = compact(copy.deepcopy(document), binary, max_size)
    data = json.dumps(document, separators=(",", ":")).encode()
    data += b" " * (-len(data) % 4)
    output.extend(b"\0" * (-len(output) % 4))
    glb = struct.pack("<III", 0x46546C67, 2, 28 + len(data) + len(output))
    glb += struct.pack("<II", len(data), 0x4E4F534A) + data
    glb += struct.pack("<II", len(output), 0x004E4942) + output
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / filename).write_bytes(glb)
    triangles = sum(document["accessors"][p["indices"]]["count"] // 3 for m in document["meshes"] for p in m["primitives"])
    print(f"{filename}: {len(glb):,} bytes; {len(document['meshes'])} meshes; {triangles:,} triangles")


if __name__ == "__main__":
    prepare(1024, "hugo-world.glb")
    prepare(512, "hugo-world-mobile.glb")
