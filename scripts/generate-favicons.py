import math
import os
from PIL import Image, ImageDraw, ImageFilter

def create_dentnow_icon(size):
    # Supersample 4x for extreme antialiasing quality
    scale = 4
    s = size * scale

    # 1. Background Gradient (Squircle)
    # Royal Blue (#0080FF) to Deep Navy (#0046B3)
    rx = int(s * 0.22)
    
    # Draw gradient canvas
    grad_img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad_img)
    for y in range(s):
        ratio = y / float(s)
        # Interpolate from (0, 128, 255) to (0, 70, 179)
        r = int(0 * (1 - ratio) + 0 * ratio)
        g = int(128 * (1 - ratio) + 70 * ratio)
        b = int(255 * (1 - ratio) + 179 * ratio)
        g_draw.line([(0, y), (s - 1, y)], fill=(r, g, b, 255))

    # Mask with squircle rounded rectangle
    mask = Image.new('L', (s, s), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=rx, fill=255)

    bg = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    bg.paste(grad_img, (0, 0), mask)

    # 2. Tooth geometry relative coordinates (normalized to 512)
    def p(x, y):
        return (x * s / 512.0, y * s / 512.0)

    # Tooth Path points via bezier curves
    def cubic_bezier(p0, p1, p2, p3, steps=30):
        pts = []
        for i in range(steps + 1):
            t = i / float(steps)
            x = (1-t)**3 * p0[0] + 3*(1-t)**2 * t * p1[0] + 3*(1-t) * t**2 * p2[0] + t**3 * p3[0]
            y = (1-t)**3 * p0[1] + 3*(1-t)**2 * t * p1[1] + 3*(1-t) * t**2 * p2[1] + t**3 * p3[1]
            pts.append((x, y))
        return pts

    tooth_curves = [
        # Top indent to Left Cusp
        ((256, 135), (230, 120), (190, 112), (170, 125)),
        # Left Cusp down outer crown
        ((170, 125), (140, 140), (130, 180), (135, 230)),
        # Outer crown to left root
        ((135, 230), (140, 280), (160, 320), (180, 360)),
        # Left root to left root tip
        ((180, 360), (190, 380), (192, 415), (205, 415)),
        # Left root tip up to inner arch
        ((205, 415), (218, 415), (235, 360), (256, 325)),
        # Inner arch down to right root tip
        ((256, 325), (277, 360), (294, 415), (307, 415)),
        # Right root tip to right outer root
        ((307, 415), (320, 415), (322, 380), (332, 360)),
        # Right outer root up to outer crown
        ((332, 360), (352, 320), (372, 280), (377, 230)),
        # Outer crown to right cusp
        ((377, 230), (382, 180), (372, 140), (342, 125)),
        # Right cusp back to top indent
        ((342, 125), (322, 112), (282, 120), (256, 135))
    ]

    polygon_pts = []
    for p0, p1, p2, p3 in tooth_curves:
        pts = cubic_bezier(p(p0[0], p0[1]), p(p1[0], p1[1]), p(p2[0], p2[1]), p(p3[0], p3[1]))
        polygon_pts.extend(pts[:-1])

    # Draw Tooth Shadow on BG
    shadow_layer = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    shadow_pts = [(x, y + s*0.015) for x, y in polygon_pts]
    s_draw.polygon(shadow_pts, fill=(0, 25, 75, 120))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=s*0.02))
    bg.paste(shadow_layer, (0, 0), shadow_layer)

    # Draw Main Tooth
    tooth_layer = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    t_draw = ImageDraw.Draw(tooth_layer)
    t_draw.polygon(polygon_pts, fill=(255, 255, 255, 255))

    # Add tooth inner highlight gradient (smooth white to icy blue)
    tooth_mask = tooth_layer.split()[3]
    gradient_tooth = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    gt_draw = ImageDraw.Draw(gradient_tooth)
    for y in range(s):
        ratio = y / float(s)
        # White #FFFFFF at top to #E0F2FE at bottom
        r = int(255 * (1 - ratio) + 224 * ratio)
        g = int(255 * (1 - ratio) + 242 * ratio)
        b = int(255 * (1 - ratio) + 254 * ratio)
        gt_draw.line([(0, y), (s - 1, y)], fill=(r, g, b, 255))
    
    bg.paste(gradient_tooth, (0, 0), tooth_mask)

    # Sparkle star on top-right of crown (380, 130 in 512 space)
    sparkle_center = p(380, 130)
    sp_x, sp_y = sparkle_center
    sp_size = s * 0.075

    sparkle_pts = [
        (sp_x, sp_y - sp_size),
        (sp_x + sp_size * 0.2, sp_y - sp_size * 0.2),
        (sp_x + sp_size, sp_y),
        (sp_x + sp_size * 0.2, sp_y + sp_size * 0.2),
        (sp_x, sp_y + sp_size),
        (sp_x - sp_size * 0.2, sp_y + sp_size * 0.2),
        (sp_x - sp_size, sp_y),
        (sp_x - sp_size * 0.2, sp_y - sp_size * 0.2)
    ]
    sp_layer = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    sp_draw = ImageDraw.Draw(sp_layer)
    sp_draw.polygon(sparkle_pts, fill=(56, 189, 248, 255)) # Cyan glow
    
    # Inner white core of sparkle
    core_size = sp_size * 0.5
    core_pts = [
        (sp_x, sp_y - core_size),
        (sp_x + core_size * 0.2, sp_y - core_size * 0.2),
        (sp_x + core_size, sp_y),
        (sp_x + core_size * 0.2, sp_y + core_size * 0.2),
        (sp_x, sp_y + core_size),
        (sp_x - core_size * 0.2, sp_y + core_size * 0.2),
        (sp_x - core_size, sp_y),
        (sp_x - core_size * 0.2, sp_y - core_size * 0.2)
    ]
    sp_draw.polygon(core_pts, fill=(255, 255, 255, 255))

    bg.paste(sp_layer, (0, 0), sp_layer)

    # Downsample using LANCZOS for high quality anti-aliasing
    final_img = bg.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

# Generate files
os.makedirs('/home/bogdan/workspace/dev/dentnow-react/dentnow-react/public', exist_ok=True)

# 1. 512x512 PNG
img_512 = create_dentnow_icon(512)
img_512.save('/home/bogdan/workspace/dev/dentnow-react/dentnow-react/public/web-app-manifest-512x512.png', 'PNG')
print("Generated web-app-manifest-512x512.png")

# 2. 192x192 PNG
img_192 = create_dentnow_icon(192)
img_192.save('/home/bogdan/workspace/dev/dentnow-react/dentnow-react/public/web-app-manifest-192x192.png', 'PNG')
print("Generated web-app-manifest-192x192.png")

# 3. Apple Touch Icon (180x180)
img_180 = create_dentnow_icon(180)
img_180.save('/home/bogdan/workspace/dev/dentnow-react/dentnow-react/public/apple-touch-icon.png', 'PNG')
print("Generated apple-touch-icon.png")

# 4. Standard 96x96 Favicon PNG
img_96 = create_dentnow_icon(96)
img_96.save('/home/bogdan/workspace/dev/dentnow-react/dentnow-react/public/favicon-96x96.png', 'PNG')
img_96.save('/home/bogdan/workspace/dev/dentnow-react/dentnow-react/public/favicon.png', 'PNG')
print("Generated favicon-96x96.png and favicon.png")

# 5. Multi-resolution ICO (16x16, 32x32, 48x48)
img_16 = create_dentnow_icon(16)
img_32 = create_dentnow_icon(32)
img_48 = create_dentnow_icon(48)
img_32.save(
    '/home/bogdan/workspace/dev/dentnow-react/dentnow-react/public/favicon.ico',
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[img_16, img_48]
)
print("Generated favicon.ico successfully!")
