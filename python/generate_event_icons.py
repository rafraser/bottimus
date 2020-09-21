from prizeball import generate_frame
from PIL import Image, ImageFilter, ImageOps, ImageChops
import os

# Background colours for the events
background_colors = {
    "art": "pink",
    "csgo": "yellow",
    "death": "purple",
    "deathrun": "red",
    "dodgeball": "blue",
    "dota": "red",
    "generic": "blue",
    "gmod": "blue",
    "golf": "green",
    "hidden": "red",
    "jackbox": "purple",
    "league": "purple",
    "mapping": "green",
    "minecraft": "green",
    "minigames": "yellow",
    "movie": "pink",
    "murder": "red",
    "music": "pink",
    "overwatch": "yellow",
    "racing": "green",
    "sandbox": "green",
    "stream": "pink",
    "switch": "red",
    "testing": "green",
    "tower": "blue",
    "voice": "blue",
    "zombie": "red",
}


def invert_with_alpha(img: Image, alpha: int):
    """Invert the colours of an image, while multiplying the alpha

    Args:
        img (Image): Image to invert
        alpha (int): Desired alpha to multiply by

    Returns:
        Image: Image with RGB inverted, and A multiplied by specified alpha
    """
    # Invert colours
    r, g, b, a = img.split()
    rgb_image = Image.merge("RGB", (r, g, b))
    inverted = ImageOps.invert(rgb_image)
    r2, g2, b2 = inverted.split()

    # Multiply the alpha
    a2 = Image.new("L", img.size, alpha)
    a2 = ImageChops.multiply(a, a2)
    img = Image.merge("RGBA", (r2, g2, b2, a2))
    return img


def render_foreground(img: Image) -> Image:
    """Render the foreground for an event icon
    This includes resizing the icon along with adding a subtle dropshadow

    Args:
        img (Image): Loaded event image

    Returns:
        Image: Output image with drop shadow
    """
    canvas = Image.new("RGBA", img.size)
    shadow = img.filter(ImageFilter.GaussianBlur(4))
    shadow = invert_with_alpha(shadow, 120)

    canvas.paste(shadow, (4, 4))
    canvas = Image.alpha_composite(canvas, img)
    return canvas


def render_icon(event: str):
    """Generate a single event icon
    This will load the event icon, add drop shadow, and paste onto a sunburst background

    Args:
        event (str): Filename (with extension) to generate icon for
    """
    foreground = Image.open(f"./img/event/{event}").resize((512, 512)).convert("RGBA")
    foreground = render_foreground(foreground)

    color = background_colors.get(event.replace(".png", ""))

    background = generate_frame(0, color)
    background.paste(foreground, (0, 0), foreground)
    background.save(f"./img/event_generated/{event}")


def main():
    """Generate event icons for all event icons found in the image folder
    """
    os.makedirs("./img/event_generated/", exist_ok=True)
    for img in os.listdir("./img/event"):
        render_icon(img)


if __name__ == "__main__":
    main()