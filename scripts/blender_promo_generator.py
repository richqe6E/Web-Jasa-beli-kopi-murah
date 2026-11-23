"""
====================================================================
JASDOR RISGOLD - BLENDER 3D PROMO VIDEO SCENE GENERATOR (bpy)
Kompatibel dengan Blender 3.6+ dan Blender 4.x (EEVEE / Cycles)
--------------------------------------------------------------------
Cara Pakai di Blender:
1. Buka aplikasi Blender -> Tab "Scripting" -> Klik "New" atau "Open".
2. Buka file `scripts/blender_promo_generator.py` ini lalu klik "Run Script".
3. Script otomatis membuat:
   - 3D Smartphone Titanium Blue dengan Bevel halus & Layar Emisif
   - 6 Kartu UI Liquid Glass Melayang (Pop-out 3D Layers untuk 6 Scene)
   - 3 Lampu Studio Area Light (Royal Blue, Cyan Rim, Warm Key Light)
   - Animasi Kamera 30 Detik (1800 Frame @ 60 FPS, Resolusi 1080x1920 9:16)
4. (Opsional) Unduh 6 Frame PNG dari https://jasdor.web.id/promo-video
   untuk dipasang sebagai tekstur gambar pada plane layar & kartu.
====================================================================
"""

import bpy
import math


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def make_material(name, base_color, metallic=0.0, roughness=0.25, emission_color=None, emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = alpha
        if emission_color and emission_strength > 0:
            if "Emission Color" in bsdf.inputs:
                bsdf.inputs["Emission Color"].default_value = emission_color
                bsdf.inputs["Emission Strength"].default_value = emission_strength
            elif "Emission" in bsdf.inputs:
                bsdf.inputs["Emission"].default_value = emission_color
    if alpha < 1.0 and hasattr(mat, "blend_method"):
        mat.blend_method = "BLEND"
    return mat


def add_rounded_box(name, size_x, size_y, size_z, bevel_width=0.06, location=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size_x, size_y, size_z)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    bevel = obj.modifiers.new(name="Bevel", type="BEVEL")
    bevel.width = bevel_width
    bevel.segments = 8
    bpy.ops.object.shade_smooth()
    return obj


def build_jasdor_promo_scene():
    clear_scene()
    scene = bpy.context.scene
    scene.render.fps = 60
    scene.frame_start = 1
    scene.frame_end = 1800  # 30.0s @ 60 FPS
    scene.render.resolution_x = 1080
    scene.render.resolution_y = 1920
    scene.render.resolution_percentage = 100

    # World Dark Navy Studio Background
    if not scene.world:
        scene.world = bpy.data.worlds.new("JasDorStudioWorld")
    scene.world.use_nodes = True
    bg_node = scene.world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs[0].default_value = (0.02, 0.045, 0.10, 1.0)
        bg_node.inputs[1].default_value = 1.0

    # Materials
    mat_titanium = make_material("TitaniumBlue", (0.07, 0.14, 0.28, 1.0), metallic=0.88, roughness=0.22)
    mat_screen = make_material(
        "JasDorScreen",
        (0.95, 0.97, 1.0, 1.0),
        metallic=0.05,
        roughness=0.12,
        emission_color=(0.04, 0.42, 0.80, 1.0),
        emission_strength=0.45
    )
    mat_card_blue = make_material(
        "RoyalBlueGlassCard",
        (0.043, 0.42, 0.796, 0.95),
        metallic=0.1,
        roughness=0.15,
        emission_color=(0.043, 0.42, 0.796, 1.0),
        emission_strength=0.8
    )
    mat_card_emerald = make_material(
        "EmeraldSavingsCard",
        (0.086, 0.639, 0.29, 0.96),
        metallic=0.1,
        roughness=0.15,
        emission_color=(0.086, 0.639, 0.29, 1.0),
        emission_strength=0.85
    )
    mat_card_white = make_material(
        "LiquidGlassWhiteCard",
        (0.98, 0.99, 1.0, 0.96),
        metallic=0.05,
        roughness=0.1
    )

    # Parent Rig for 3D Smartphone
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    phone_rig = bpy.context.active_object
    phone_rig.name = "JasDor_Phone_Rig"

    # 3D Smartphone Body & Screen
    phone_body = add_rounded_box("Phone_Chassis", 2.2, 0.16, 4.45, bevel_width=0.09, location=(0, 0, 0))
    phone_body.data.materials.append(mat_titanium)
    phone_body.parent = phone_rig

    phone_screen = add_rounded_box("Phone_Display", 2.04, 0.04, 4.26, bevel_width=0.05, location=(0, -0.075, 0))
    phone_screen.data.materials.append(mat_screen)
    phone_screen.parent = phone_rig

    # 6 Floating 3D UI Cards (Pop-out Layers matching the 6 Storyboard Scenes)
    cards_spec = [
        ("Scene1_Hook_PriceFlip", 1.9, 0.65, (0.35, -0.42, -1.0), mat_card_blue, 1, 270),
        ("Scene2_Outlet_GPS_CentralPlaza", 2.1, 0.72, (0.25, -0.48, 0.2), mat_card_white, 270, 600),
        ("Scene3_Menu_Bundling_PaketBerdua", 2.15, 0.78, (0.3, -0.55, 0.05), mat_card_white, 600, 1020),
        ("Scene4_Savings_Comparison_Hero", 2.3, 1.05, (-0.1, -0.58, 0.35), mat_card_blue, 1020, 1320),
        ("Scene5_Digital_Receipt_JPG_WA", 2.1, 1.85, (0.0, -0.62, 0.1), mat_card_white, 1320, 1560),
        ("Scene6_CTA_JasDor_Web_Id", 2.35, 0.75, (0.0, -0.65, -1.1), mat_card_emerald, 1560, 1800),
    ]

    for c_name, w, h, loc, mat, f_in, f_out in cards_spec:
        card = add_rounded_box(c_name, w, 0.04, h, bevel_width=0.03, location=loc)
        card.data.materials.append(mat)
        card.parent = phone_rig

        # Animate 3D Pop-Out scale & Z elevation per scene
        card.scale = (0.001, 0.001, 0.001)
        card.keyframe_insert(data_path="scale", frame=max(1, f_in - 12))

        card.scale = (1.06, 1.06, 1.06)
        card.keyframe_insert(data_path="scale", frame=f_in + 16)

        card.scale = (1.0, 1.0, 1.0)
        card.keyframe_insert(data_path="scale", frame=f_in + 26)
        card.keyframe_insert(data_path="scale", frame=f_out - 16)

        card.scale = (0.001, 0.001, 0.001)
        card.keyframe_insert(data_path="scale", frame=min(1800, f_out + 10))

    # Keyframe 3D Phone Rig Orbit across 6 Scenes (Frames 1 -> 1800)
    keyframes_phone = [
        (1, (-0.28, 0.05, -0.45)),
        (110, (-0.10, 0.01, -0.14)),
        (270, (-0.18, -0.03, 0.28)),
        (600, (-0.12, 0.02, -0.26)),
        (1020, (0.08, -0.02, 0.32)),
        (1320, (-0.16, 0.0, -0.12)),
        (1560, (-0.06, 0.0, 0.0)),
        (1800, (-0.04, 0.0, 0.0)),
    ]
    for frame_no, rot_euler in keyframes_phone:
        phone_rig.rotation_euler = rot_euler
        phone_rig.keyframe_insert(data_path="rotation_euler", frame=frame_no)

    # Studio Area Lights
    lights = [
        ("KeyLight_Warm", (4.0, -5.0, 4.5), 450.0, (1.0, 0.98, 0.95)),
        ("FillLight_RoyalBlue", (-4.5, -4.0, 2.0), 320.0, (0.15, 0.55, 1.0)),
        ("RimLight_EmeraldCyan", (0.0, 3.5, 4.0), 380.0, (0.2, 0.9, 0.65)),
    ]
    for l_name, l_loc, energy, color in lights:
        bpy.ops.object.light_add(type="AREA", location=l_loc)
        lt = bpy.context.active_object
        lt.name = l_name
        lt.data.energy = energy
        lt.data.color = color
        lt.data.size = 4.0

    # Camera Rig (9:16 Portrait Framing)
    bpy.ops.object.camera_add(location=(0.0, -8.2, 0.15), rotation=(math.radians(89.0), 0.0, 0.0))
    cam = bpy.context.active_object
    cam.name = "JasDor_Promo_Camera"
    cam.data.lens = 45.0
    scene.camera = cam

    cam_keyframes = [
        (1, (0.0, -8.8, 0.25)),
        (270, (0.15, -7.8, 0.10)),
        (600, (-0.15, -7.5, 0.05)),
        (1020, (0.10, -7.9, 0.15)),
        (1320, (0.0, -7.6, 0.08)),
        (1560, (0.0, -8.3, 0.12)),
        (1800, (0.0, -8.5, 0.15)),
    ]
    for frame_no, c_loc in cam_keyframes:
        cam.location = c_loc
        cam.keyframe_insert(data_path="location", frame=frame_no)

    print("JasDor RisGold 3D Promo Scene berhasil dibuat! Tekan Spasi di Blender untuk memutar animasi.")


if __name__ == "__main__":
    build_jasdor_promo_scene()
