# pyright: reportMissingImports=false, reportMissingModuleSource=false
import argparse
import os

from PIL import Image, ImageDraw, ImageFont
from theia.palettes import load_or_download_palette

COLOR_HEIGHT = 32
CANVAS_WIDTH = 384
SHADOW = (50, 50, 50)


def generate_palette_preview(palette: str, output: str):
    colors = load_or_download_palette(palette, save=True)
    if colors is None or len(colors) < 1:
        raise ValueError("Color palette does not exist!")

    canvas = Image.new("RGBA", (CANVAS_WIDTH, len(colors) * COLOR_HEIGHT))
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.truetype("./img/font/lemonmilk-bold.ttf", 20)

    i = 0
    for name, color in colors.items():
        y1 = i * COLOR_HEIGHT
        y2 = (i + 1) * COLOR_HEIGHT
        y_mid = (y1 + y2) // 2

        draw.rectangle((0, y1, CANVAS_WIDTH, y2), fill=color)
        draw.text((16, y_mid), name, fill=SHADOW, anchor="lm", font=font)
        draw.text((14, y_mid - 2), name, fill="white", anchor="lm", font=font)
        i += 1
    canvas.save(output)


def main(palette: str):
    # Check if we already have a preview image generated
    output_dir = os.path.join("img", "palette_preview")
    os.makedirs(output_dir, exist_ok=True)

    output = os.path.join(output_dir, args.palette + ".png")
    if not os.path.isfile(output):
        generate_palette_preview(palette, output)
    print(output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="")
    parser.add_argument("palette", help="Color palette to use")
    args = parser.parse_args()
    main(palette=args.palette)
