import argparse
import math
from PIL import Image, ImageDraw, ImageFont

prizes = [
    # Row 1
    "cards",
    "chocolate",
    "dice",
    "coin",
    "mysteryorb",
    "bowlingpin",
    "dumbbell",
    # Row 2
    "oldbarrel",
    "drum",
    "toxicdrum",
    "fox",
    "icefox",
    "infinityfox",
    "rubberduck",
    # Row 3
    "gamebro",
    "gamebrocolor",
    "monitor",
    "goldmonitor",
    "redhat",
    "goldhat",
    "glasses",
    # Row 4
    "plant1",
    "plant2",
    "bonsaigreen",
    "bonsaipink",
    "popcorn",
    "soda",
    "glasses3d",
    # Row 5
    "tape1",
    "tape2",
    "tape3",
    "tape4",
    "vinyl",
    "vinylgold",
    "whiskey",
    # Row 6
    "pluto",
    "mars",
    "redrocket",
    "greenrocket",
    "bluerocket",
    "purplerocket",
    "pickaxe",
    # Row 7
    "oresilver",
    "oregold",
    "oregreen",
    "crystalbg",
    "crystalgp",
    "crystalob",
    "crystalpr"
]
background = Image.open("./img/frame.png").resize((126, 126), Image.NEAREST)


def silhoutte(image):
    """Convert an image into a silhouette
    This uses Super Advanced Techniques(TM)

    Arguments:
        image {[type]} -- Input image

    Returns:
        [type] -- Generated silhouette
    """
    pixels = image.load()
    for yy in range(1, image.height - 1):
        for xx in range(1, image.width - 1):
            # Check corners
            a = pixels[(xx, yy)][3]
            a2 = pixels[(xx + 1, yy)][3] == 0
            a3 = pixels[(xx, yy + 1)][3] == 0
            a4 = pixels[(xx + 1, yy + 1)][3] == 0
            if a == 255 and (a4 or (a2 and a3)):
                pixels[(xx, yy)] = (127, 112, 94, 255)
            elif a == 255:
                pixels[(xx, yy)] = (61, 42, 52, 255)

    return image


def renderSquare(prize=None, locked=False):
    """Render a single square of the inventory

    Keyword Arguments:
        prize {[type]} -- Prize image for this square (default: {None})
        locked {bool} -- Whether this square is unlocked or not (default: {False})

    Returns:
        [type] -- Output square image
    """
    canvas = Image.new("RGB", (126, 126))
    canvas.paste(background)

    if prize:
        prize_image = Image.open("./img/prizes/" + prize + ".png")
        if locked:
            prize_image = silhoutte(prize_image)

        prize_image = prize_image.resize((96, 96), Image.NEAREST)
        canvas.paste(prize_image, (15, 15), prize_image)

    return canvas


def renderInventory(items):
    """Render a list of items as an inventory image

    Arguments:
        items {[type]} -- List of items to have in the inventory
    """
    row_size = 7
    num_rows = math.ceil(len(prizes) / row_size)

    # Create the canvas
    inventory = Image.new("RGB", (126 * row_size, 126 * num_rows))
    font = ImageFont.truetype("./img/font/disco.ttf", 16)
    draw = ImageDraw.Draw(inventory)

    for xx in range(0, row_size):
        for yy in range(0, num_rows):
            i = xx + (row_size * yy)
            p = None
            if i < len(prizes):
                p = prizes[i]

            amount = items.get(p, 0)
            inventory.paste(renderSquare(p, amount < 1), (126 * xx, 126 * yy))

            if amount > 0:
                tw, th = draw.textsize(str(amount), font=font)
                draw.text(
                    (126 * xx + 114 - tw, 126 * yy + 114 - th),
                    str(amount),
                    font=font,
                    fill=(189, 195, 199),
                )

    inventory = inventory.resize((inventory.width * 2, inventory.height * 2), Image.NEAREST)
    inventory.save("./img/inventory.png")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate an inventory for a list of prize:amount pairs")
    parser.add_argument("--forceall", help="Force at least one of each prize to be displayed. Testing purposes only.")
    parser.add_argument(
        "--prizes",
        nargs="+",
        help="List of prizes for the inventory. Each item should be of the form prize:amount",
    )
    args = parser.parse_args()

    # Dictionary comprehension to split the prize list up
    if args.forceall:
        items = {k: 1 for k in prizes}
    else:
        items = {k: int(v) for k, v in (x.split(":") for x in args.prizes)}
    renderInventory(items)
