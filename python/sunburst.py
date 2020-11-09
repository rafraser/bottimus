from PIL import Image, ImageDraw, ImageFont
import argparse
import math
import sys
from event_categories import COLORS

def generate_frame(offset: int = 0, color: str = "yellow"):
    """Generate a single frame for a sunburst award

    Keyword Arguments:
        offset {int} -- Angular offset to use (in degrees) (default: {0})
        color {str} -- Color to use for the sunburst beams (default: {"yellow"})

    Returns:
        Image -- 512x512 sunburst frame image
    """
    # Setup the canvas
    c = COLORS[color]
    canvas = Image.new("RGBA", (768, 768), c[0])
    draw = ImageDraw.Draw(canvas)
    n = 5
    q = 360 / (2 * n)

    # Render each 'beam' of the sunbeam effect
    for i in range(n):
        startang = offset + 2 * (i - 1) * q
        endang = offset + (2 * (i - 1) + 1) * q
        draw.pieslice((0, 0, 768, 768), startang, endang, fill=c[1])

    # Crop to the center 512x
    return canvas.crop((128, 128, 640, 640))


def render_award(
    imagename: str,
    color: str,
    output: str,
    toptext: str = None,
    bottomtext: str = None,
    fontname: str = "disco",
):
    """Generate the sunburst award GIF
    This will generate a sequence of 'sunburst' frames, then overlay the prize image and text onto each frame

    This does not return the GIF - it only saves it!

    Arguments:
        imagename {str} -- Prize image to overlay on the sunburst
        color {str} -- Color name for the sunburst - see the COLORS constant
        output {str} -- Output filename (including .gif extension)

    Keyword Arguments:
        toptext {str} -- Text to put above the image (default: {None})
        bottomtext {str} -- Text to put below the image (default: {None})
        fontname {str} -- Font name to use in the image (default: {"disco"})
    """
    # Load image and font
    prize = Image.open(f"./img/{imagename}.png").resize((256, 256))
    font = ImageFont.truetype(f"./img/font/{fontname}.ttf", 52)
    mid = math.floor(256 / 2)

    # Generate 60 frames
    frames = []
    for i in range(60):
        img = generate_frame(i * (72 / 60), color)
        img.paste(prize, (mid, mid), prize)
        textcolor = (0, 0, 0) if (color == "white") else (255, 255, 255)

        draw = ImageDraw.Draw(img)
        if toptext != None:
            tw, th = draw.textsize(toptext, font=font)
            draw.text(
                ((512 - tw) / 2, 48 - (th / 2)), toptext, font=font, fill=textcolor
            )

        if bottomtext != None:
            tw, th = draw.textsize(bottomtext, font=font)
            draw.text(
                ((512 - tw) / 2, 512 - 48 - (th / 2)),
                bottomtext,
                font=font,
                fill=textcolor,
            )

        frames.append(img)

    # Save the gif to a file
    frames[0].save(
        f"./img/{output}.gif",
        format="GIF",
        append_images=frames[1:],
        save_all=True,
        duration=20,
        loop=0,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a prize reveal gif animation"
    )
    parser.add_argument("image", help="Image source for the prize")
    parser.add_argument(
        "--color", default="yellow", help="Background color for the sunburst"
    )
    parser.add_argument(
        "--toptext", default=None, help="Text to display above the prize"
    )
    parser.add_argument(
        "--bottomtext", default=None, help="Text to display below the prize"
    )
    parser.add_argument(
        "--font", default="disco", help="Font to use for the displayed text"
    )
    parser.add_argument(
        "--output", default="sunbeam.gif", help="Output filename (include .gif extension)"
    )
    args = parser.parse_args()

    render_award(
        args.image,
        args.color,
        args.output
        toptext=args.toptext,
        bottomtext=args.bottomtext,
        fontname=args.font,
    )
