import math
import os
from PIL import Image, ImageDraw

def generate_pngs():
    size = 1080
    scale = 2  # Super-sample at 2x (2160x2160) for crisp anti-aliasing
    S = size * scale
    svg_scale = S / 100.0

    # 1. Color gradient stops
    # 0%: #2575FC (37, 117, 252)
    # 60%: #125BE8 (18, 91, 232)
    # 100%: #0846C8 (8, 70, 200)
    def get_color(t):
        t = max(0.0, min(1.0, t))
        if t <= 0.6:
            u = t / 0.6
            r = int(round(37 + (18 - 37) * u))
            g = int(round(117 + (91 - 117) * u))
            b = int(round(252 + (232 - 252) * u))
        else:
            u = (t - 0.6) / 0.4
            r = int(round(18 + (8 - 18) * u))
            g = int(round(91 + (70 - 91) * u))
            b = int(round(232 + (200 - 232) * u))
        return (r, g, b, 255)

    # Diagonal gradient along 45 degrees (from top-left (0,0) to bottom-right (S,S))
    # Distance projection along (1, 1) normalized is (x + y) / (2 * S)
    grad_len = int(math.ceil(math.sqrt(2) * S))
    strip = Image.new("RGBA", (grad_len, 1))
    strip_pixels = strip.load()
    for x in range(grad_len):
        strip_pixels[x, 0] = get_color(x / float(grad_len))

    # Expand strip to 2D
    grad_tall = strip.resize((grad_len, grad_len), Image.Resampling.BILINEAR)
    # Rotate 45 degrees
    grad_rot = grad_tall.rotate(45, resample=Image.Resampling.BICUBIC)
    # Crop center (S, S)
    cx, cy = grad_rot.width // 2, grad_rot.height // 2
    bg_gradient = grad_rot.crop((cx - S // 2, cy - S // 2, cx + S // 2, cy + S // 2))

    # Dense cubic Bezier evaluation for perfectly smooth tubular stroke
    def cubic_bezier(p0, p1, p2, p3, steps=1000):
        pts = []
        for i in range(steps + 1):
            t = i / float(steps)
            mt = 1.0 - t
            x = (mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0])
            y = (mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1])
            pts.append((x * svg_scale, y * svg_scale))
        return pts

    # Path segments from public/logo.svg
    curves = [
        ((28, 68), (23, 50), (27, 34), (35, 27)),
        ((35, 27), (41, 21), (46, 24), (45, 34)),
        ((45, 34), (42, 47), (34, 62), (29, 72)),
        ((29, 72), (33, 76), (39, 77), (46, 73)),
        ((46, 73), (51, 70), (55, 60), (57, 49)),
        ((57, 49), (58, 58), (59, 69), (64, 71)),
        ((64, 71), (68, 72), (71, 65), (73, 49)),
        ((73, 49), (74, 57), (75, 67), (79, 69)),
        ((79, 69), (82, 70), (85, 65), (87, 61))
    ]

    all_points = []
    for idx, (p0, p1, p2, p3) in enumerate(curves):
        pts = cubic_bezier(p0, p1, p2, p3, steps=1200)
        if idx > 0:
            pts = pts[1:]
        all_points.extend(pts)

    stroke_r = (6.0 * svg_scale) / 2.0

    # Function to draw the white monogram with 100% solid, flawless fill
    def draw_monogram(target_img):
        draw = ImageDraw.Draw(target_img)
        # Render dense circles along path
        for pt in all_points:
            x, y = pt
            draw.ellipse([x - stroke_r, y - stroke_r, x + stroke_r, y + stroke_r], fill=(255, 255, 255, 255))

    # Output directory
    out_dir = os.path.join(os.path.dirname(__file__), "..", "public")
    os.makedirs(out_dir, exist_ok=True)

    # ----------------------------------------------------
    # BASE SQUIRCLE ICON (High-Res 1080x1080)
    # ----------------------------------------------------
    img_squircle = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    mask = Image.new("L", (S, S), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = int(round(26.0 * svg_scale))
    mask_draw.rounded_rectangle([0, 0, S, S], radius=radius, fill=255)
    img_squircle.paste(bg_gradient, (0, 0), mask)
    draw_monogram(img_squircle)
    final_squircle = img_squircle.resize((size, size), Image.Resampling.LANCZOS)
    path1 = os.path.join(out_dir, "logo.png")
    final_squircle.save(path1, "PNG", optimize=True)
    print(f"Created: {path1}")

    # ----------------------------------------------------
    # VARIANT A: profile-fullbleed.png (RECOMMENDED FOR INSTAGRAM / TIKTOK)
    # Full royal blue gradient with optically centered monogram & circle safe-zone padding
    # ----------------------------------------------------
    # Re-sample points scaled to 80% and centered at (50, 50)
    opt_cx = 53.5
    opt_cy = 49.5
    scale_factor = 0.80

    centered_points = []
    for (px, py) in all_points:
        # Convert back to 0-100 coords
        ux = px / svg_scale
        uy = py / svg_scale
        # Scale around optical center, then move to 50,50
        nx = 50.0 + (ux - opt_cx) * scale_factor
        ny = 50.0 + (uy - opt_cy) * scale_factor
        centered_points.append((nx * svg_scale, ny * svg_scale))

    c_stroke_r = (6.0 * scale_factor * svg_scale) / 2.0

    img_fullbleed = bg_gradient.copy()
    fb_draw = ImageDraw.Draw(img_fullbleed)
    for pt in centered_points:
        x, y = pt
        fb_draw.ellipse([x - c_stroke_r, y - c_stroke_r, x + c_stroke_r, y + c_stroke_r], fill=(255, 255, 255, 255))

    final_fullbleed = img_fullbleed.resize((size, size), Image.Resampling.LANCZOS)
    path_fb = os.path.join(out_dir, "profile-fullbleed.png")
    final_fullbleed.save(path_fb, "PNG", optimize=True)
    # Also save as logo-profile.png for easy reference
    final_fullbleed.save(os.path.join(out_dir, "logo-profile.png"), "PNG", optimize=True)
    print(f"Created: {path_fb}")

    # ----------------------------------------------------
    # VARIANT B: profile-badge-dark.png (Sleek Obsidian Dark with Glowing Squircle Badge)
    # ----------------------------------------------------
    badge_scale = 0.74
    badge_S = int(round(S * badge_scale))
    scaled_badge = img_squircle.resize((badge_S, badge_S), Image.Resampling.LANCZOS)

    # Ambient glow around badge
    from PIL import ImageFilter
    glow_mask = mask.resize((badge_S, badge_S), Image.Resampling.LANCZOS)
    glow_img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    glow_color = Image.new("RGBA", (badge_S, badge_S), (37, 117, 252, 160))
    offset = (S - badge_S) // 2
    glow_img.paste(glow_color, (offset, offset), glow_mask)
    glow_blurred = glow_img.filter(ImageFilter.GaussianBlur(radius=int(60 * (S / 1080))))

    # Dark background #0B0F19
    dark_canvas = Image.new("RGBA", (S, S), (11, 15, 25, 255))
    dark_canvas.alpha_composite(glow_blurred)
    dark_canvas.alpha_composite(scaled_badge, (offset, offset))

    final_badge_dark = dark_canvas.resize((size, size), Image.Resampling.LANCZOS)
    path_dark = os.path.join(out_dir, "profile-badge-dark.png")
    final_badge_dark.save(path_dark, "PNG", optimize=True)
    print(f"Created: {path_dark}")

    # ----------------------------------------------------
    # VARIANT C: profile-badge-clean.png (Pure Crisp White with Soft Ambient Drop Shadow)
    # ----------------------------------------------------
    shadow_img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    shadow_mask = glow_mask
    shadow_color = Image.new("RGBA", (badge_S, badge_S), (18, 91, 232, 90))
    shadow_offset_y = offset + int(24 * (S / 1080))
    shadow_img.paste(shadow_color, (offset, shadow_offset_y), shadow_mask)
    shadow_blurred = shadow_img.filter(ImageFilter.GaussianBlur(radius=int(50 * (S / 1080))))

    white_canvas = Image.new("RGBA", (S, S), (255, 255, 255, 255))
    white_canvas.alpha_composite(shadow_blurred)
    white_canvas.alpha_composite(scaled_badge, (offset, offset))

    final_badge_clean = white_canvas.resize((size, size), Image.Resampling.LANCZOS)
    path_clean = os.path.join(out_dir, "profile-badge-clean.png")
    final_badge_clean.save(path_clean, "PNG", optimize=True)
    print(f"Created: {path_clean}")

if __name__ == "__main__":
    generate_pngs()
