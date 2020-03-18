from PIL import Image, ImageDraw, ImageFont
import math
import sys
import random

ball = Image.open("./img/gacha/" + str(random.randint(1, 6)) + ".png").resize(
    (192, 192), Image.NEAREST
)

# List of colors
colors = {}
colors["yellow"] = ((251, 197, 49), (225, 177, 44))
colors["purple"] = ((156, 136, 255), (140, 122, 230))
colors["blue"] = ((0, 168, 255), (0, 151, 230))
colors["red"] = ((232, 65, 24), (194, 54, 22))
colors["green"] = ((76, 209, 55), (68, 189, 50))
colors["orange"] = ((255, 190, 118), (240, 147, 43))
colors["white"] = ((245, 246, 250), (220, 221, 225))

colors["Rare"] = ((156, 136, 255), (140, 122, 230))
colors["Uncommon"] = ((0, 168, 255), (0, 151, 230))
colors["Common"] = ((76, 209, 55), (68, 189, 50))
colors["Legendary"] = ((255, 190, 118), (240, 147, 43))
colors["Epic Legend"] = ((232, 65, 24), (194, 54, 22))


def render_first(frame):
    yy = math.floor(32 * abs(math.sin(math.pi * frame / 10)))
    ang = math.floor(6 * (math.cos(math.pi * frame / 10)))
    background = Image.new("RGBA", (512, 512), (47, 54, 64))
    mid = math.floor((512 - 192) / 2)
    ball2 = ball.rotate(ang)
    background.paste(ball2, (mid, mid - yy), ball2)
    return background


def render_transition(frame, color="yellow"):
    r = frame * 24
    c = colors[color]
    canvas = Image.new("RGBA", (768, 768), (255, 255, 255, 0))
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((384 - r, 384 - r, 384 + r, 384 + r), fill=c[0])
    c2 = canvas.crop((128, 128, 640, 640))
    return c2


def generate_frame(offset=0, color="yellow"):
    # Setup the canvas
    c = colors[color]
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
    c2 = canvas.crop((128, 128, 640, 640))
    return c2


def render_prize(frame, background, prize, color, toptext, bottomtext):
    font = ImageFont.truetype("./img/font/disco.ttf", 52)
    font_smaller = ImageFont.truetype("./img/font/disco.ttf", 44)
    mid = math.floor(256 / 2)
    # Render the background
    canvas = background.copy()

    # Render the transition
    circle = render_transition(frame)

    # Render foreground with mask
    img = generate_frame(frame * (72 / 60), color)
    textcolor = (255, 255, 255)
    if color == "white":
        textcolor = (0, 0, 0)

    if toptext != None:
        draw = ImageDraw.Draw(img)
        tw, th = draw.textsize(toptext, font=font)
        draw.text(((512 - tw) / 2, 48 - (th / 2)), toptext, font=font, fill=textcolor)

        # If the bottom text is too large, adjust to use a smaller font
        tw, th = draw.textsize(bottomtext, font=font)
        if tw > 480:
            tw, th = draw.textsize(bottomtext, font=font_smaller)
            draw.text(
                ((512 - tw) / 2, 512 - 48 - (th / 2)), bottomtext, font=font_smaller, fill=textcolor
            )
        else:
            draw.text(
                ((512 - tw) / 2, 512 - 48 - (th / 2)), bottomtext, font=font, fill=textcolor
            )

    img.paste(prize, (mid, mid), prize)
    canvas.paste(img, (0, 0), circle)
    return canvas


def render_award(image, color, toptext, bottomtext):
    frames = []
    prize = Image.open("./img/" + image + ".png").resize((256, 256), Image.NEAREST)
    len_start = 40
    len_finish = 150
    # Bounce the ball twice
    for i in range(len_start):
        frames.append(render_first(i))

    # Render the prize unveiling
    for i in range(len_finish):
        frames.append(render_prize(i, frames[20], prize, color, toptext, bottomtext))

    # Open the ball
    durations = ([40] * len_start) + ([20] * len_finish)
    durations[0] = 500
    durations[len_start] = 800
    durations[20] = 500
    frames[0].save(
        "./img/prizeball.gif",
        format="GIF",
        append_images=frames[1:],
        save_all=True,
        duration=durations,
        loop=0,
    )


if __name__ == "__main__":
    image = sys.argv[1]
    color = sys.argv[2]
    toptext = sys.argv[3]
    bottomtext = sys.argv[4]
    render_award(image, color, toptext, bottomtext)
