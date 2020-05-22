from PIL import Image, ImageFont, ImageDraw
import spinner
import math
import random
import sys
import argparse

NUMBERS = [
    0,
    32,
    15,
    19,
    4,
    21,
    2,
    25,
    17,
    34,
    6,
    27,
    13,
    36,
    11,
    30,
    8,
    23,
    10,
    5,
    24,
    16,
    33,
    1,
    20,
    14,
    31,
    9,
    22,
    18,
    29,
    7,
    28,
    12,
    35,
    3,
    26,
]

COLOR_RED = (194, 54, 22)
COLOR_BLACK = (47, 54, 64)
COLOR_GREEN = (33, 140, 116)

# Render the emblem
def render_emblem(logo, insize=288):
    """Generate a special emblem for roulette
    This is a simple version with no image

    Arguments:
        logo {[type]} -- Irrelevant parameter

    Keyword Arguments:
        insize {int} -- Radius for the emblem (default: {288})

    Returns:
        [type] -- Output generated emblem
    """
    canvas = Image.new("RGBA", (1024, 1024))
    draw = ImageDraw.Draw(canvas)

    # Render the inner wheel
    left = math.floor((1024 - insize) / 2)
    draw.pieslice(
        (left - 8, left - 8, left + insize + 8, left + insize + 8),
        0,
        360,
        (245, 246, 250),
    )
    draw.pieslice((left, left, left + insize, left + insize), 0, 360, (229, 142, 38))

    # Render a 'ball' instead of the traditional pointer
    left = left - 96
    bradius = 20
    draw.pieslice(
        (left - bradius, 512 - bradius, left + bradius, 512 + bradius),
        0,
        360,
        (189, 195, 199),
    )

    return canvas


def main(filename="./img/roulette.gif", emblem="./img/cat.png", fontname="disco"):
    """Generate a roulette wheel animation
    Internally, this uses code found in spinner.py but with a different emblem function

    Keyword Arguments:
        filename {str} -- Output filename to save to (default: {"./img/roulette.gif"})
        emblem {str} -- Irrelevant parameter (default: {"./img/cat.png"})
        fontname {str} -- Font to render numbers with (default: {"disco"})
    """
    # Load resources
    logo = Image.open(emblem).resize((160, 160))
    font = ImageFont.truetype(f"./img/font/{fontname}.ttf", 48)

    # Run the animation
    colors = [COLOR_GREEN] + ([COLOR_RED, COLOR_BLACK] * 18)
    display_numbers = [str(x) for x in NUMBERS]
    frames, durations, ang = spinner.generate_animation(
        90,
        37,
        display_numbers,
        colors,
        logo,
        font,
        416,
        448,
        4,
        emblem_func=render_emblem,
    )

    # Save the GIF
    frames[0].save(
        filename,
        format="GIF",
        append_images=frames[1:],
        save_all=True,
        duration=durations,
        loop=0,
    )

    # Figure out the winning prize
    width = 360 / 37
    offset = 180 + (width / 2)
    print(NUMBERS[math.floor(((ang + offset) % 360) / width)])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a roulette wheel animation")
    parser.add_argument(
        "--output", default="./img/roulette.gif", help="Output file path"
    )
    args = parser.parse_args()
    main(filename=args.output)
