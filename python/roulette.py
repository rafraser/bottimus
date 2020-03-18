from PIL import Image, ImageFont
import spinner
import math
import random
import sys

ROULETTE_FONT = ImageFont.truetype("./img/font/disco.ttf", 48)

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


def main(filename="./img/roulette.gif"):
    # Load resources
    logo = Image.open("./img/cat.png").resize((160, 160))

    # Run the animation
    colors = [COLOR_GREEN] + ([COLOR_BLACK, COLOR_RED] * 18)
    display_numbers = [str(x) for x in NUMBERS]
    frames, durations, ang = spinner.generate_animation(
        90, 37, display_numbers, colors, logo, ROULETTE_FONT, 416, 448, 4
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
    main("./img/roulette.gif")

