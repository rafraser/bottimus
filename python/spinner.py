from PIL import Image, ImageDraw, ImageFont
import math
import random
import sys

DEFAULT_FONT = ImageFont.truetype("./img/font/disco.ttf", 56)

# Draw the slice text / icon
def render_prize(prizes, ang, i, font):
    ang = (360 - ang) % 360
    canvas = Image.new("RGBA", (1024, 1024))
    draw = ImageDraw.Draw(canvas)

    # Load image files in string denoted by #
    if prizes[i].startswith("#"):
        p = prizes[i].split(" ")
        filename = p.pop(0).replace("#", "")
        if len(p) > 0:
            # Draw text & small image
            text = " ".join(p)

            image = (
                Image.open("img/" + filename + ".png").convert("RGBA").resize((96, 96))
            )
            canvas.paste(image, (96, math.floor((1024 - 96) / 2)), image)

            tw, th = draw.textsize(prizes[i], font=font)
            draw.text((208, (1024 - th) / 2), text, font=font)
        else:
            # Draw large image
            image = (
                Image.open("img/" + filename + ".png")
                .convert("RGBA")
                .resize((128, 128))
            )
            canvas.paste(image, (160, math.floor((1024 - 96) / 2) - 4), image)
    else:
        tw, th = draw.textsize(prizes[i], font=font)
        draw.text((112, (1024 - th) / 2), prizes[i], font=font)

    canvas = canvas.rotate(ang, center=(512, 512))
    return canvas


# Render the emblem
def render_emblem(logo):
    canvas = Image.new("RGBA", (1024, 1024))
    draw = ImageDraw.Draw(canvas)

    # Render the inner wheel
    insize = 288
    left = math.floor((1024 - insize) / 2)
    draw.pieslice(
        (left - 8, left - 8, left + insize + 8, left + insize + 8),
        0,
        360,
        (245, 246, 250),
    )
    draw.pieslice((left, left, left + insize, left + insize), 0, 360, (0, 168, 255))

    # Stamp the emblem
    p = math.floor(left + (insize - logo.width) / 2)
    canvas.paste(logo, (p, p), logo)

    # Render the pointer
    draw.polygon([(32, 512 + 64), (104, 512), (32, 512 - 64)], (189, 195, 199))

    return canvas


def render_background():
    canvas = Image.new("RGBA", (1024, 1024), (45, 52, 54))
    draw = ImageDraw.Draw(canvas)

    # Render the background circle
    draw.pieslice((64, 64, 960, 960), 0, 360, (245, 246, 250))

    return canvas


# Render the wheel
def render_spinner(prizes, n, colors, font):
    canvas = Image.new("RGBA", (1024, 1024))
    draw = ImageDraw.Draw(canvas)
    width = 360 / n
    offset = width / 2
    ang = -offset

    radius = 448

    for i in range(n):
        color = colors[i]

        # Render the slice and the lines
        draw.pieslice((80, 80, 944, 944), ang, ang + width, color)
        rad = math.radians(ang)
        draw.line(
            (512, 512, 512 + radius * math.cos(rad), 512 + radius * math.sin(rad)),
            (245, 246, 250),
            8,
        )

        # Render the prize information
        prize = render_prize(prizes, ang + offset + 180, i, font)
        canvas.paste(prize, (0, 0), prize)
        ang = ang + width

    # Add an extra line at the end
    rad = math.radians(ang)
    draw.line(
        (512, 512, 512 + radius * math.cos(rad), 512 + radius * math.sin(rad)),
        (245, 246, 250),
        8,
    )

    return canvas


# Render each frame of the animation
def render_frame(background, emblem, spinner, rotation):
    canvas = background.copy()
    spin = spinner.rotate(rotation, center=(256, 256))
    canvas.paste(spin, (0, 0), spin)
    canvas.paste(emblem, (0, 0), emblem)

    return canvas


def generate_animation(count, n, prizes, colors, logo, font=DEFAULT_FONT):
    frames = []
    velocity = random.uniform(8, 20)
    acceleration = -velocity / count
    ang = random.randint(0, n) * (360 / n)

    # Render the important parts only once
    background = render_background().resize((512, 512), Image.BICUBIC)
    emblem = render_emblem(logo).resize((512, 512), Image.BICUBIC)
    spinner = render_spinner(prizes, n, colors, font).resize((512, 512), Image.BICUBIC)

    # Spin the wheel!
    for i in range(count - 1):
        frames.append(render_frame(background, emblem, spinner, ang))
        ang += velocity
        velocity += acceleration
    # Once more for the last frame
    frames.append(render_frame(background, emblem, spinner, ang))

    # Setup frame durations
    durations = [20] * count
    durations[0] = 1000
    durations[-1] = 2500
    return frames, durations, ang


def pick_random_colors(n):
    # Pick colors
    colors = [
        (232, 67, 147),
        (108, 92, 231),
        (0, 206, 201),
        (255, 159, 67),
        (249, 202, 36),
        (235, 77, 75),
    ]
    random.shuffle(colors)
    if n < 5:
        colors = colors[:n]
    else:
        colors = colors[: math.ceil(n / 2)]
        while len(colors) < n:
            colors = colors * 2

    return colors


def main(prizes, filename="./img/wheel.gif"):
    # Load resources
    logo = Image.open("./img/cat.png").resize((160, 160))
    n = len(prizes)

    # Run the animation
    colors = pick_random_colors(n)
    frames, durations, ang = generate_animation(90, n, prizes, colors, logo)

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
    width = 360 / n
    offset = 180 + (width / 2)
    print(prizes[math.floor(((ang + offset) % 360) / width)])


if __name__ == "__main__":
    prizes = sys.argv[1:]
    main(prizes, "./img/spinner.gif")
