from PIL import Image, ImageDraw, ImageFont
import random
import itertools
import physics

DEFAULT_FONT40 = ImageFont.truetype("../../img/font/disco.ttf", 40)
DEFAULT_FONT32 = ImageFont.truetype("../../img/font/disco.ttf", 32)


def generate_pegs(objects, width, height):
    for (x, y) in itertools.product(list(range(64, width, 64)), range(128, height, 128)):
        objects.append(physics.Peg(x, y, 8))

    for (x, y) in itertools.product(list(range(32, width + 64, 64)), range(192, height - 64, 128)):
        objects.append(physics.Peg(x, y, 8))


def generate_balls(objects, width):
    # balls = []
    # for x in range(32, width, 32):
    #     for y in range(-60, 0, 24):
    #         ball = physics.Ball(random.uniform(x - 8, x + 8), y)
    #         ball.velocity = physics.Vector(
    #             random.uniform(-1, 1), 1 + random.uniform(0, 1)
    #         )
    #         balls.append(ball)
    # return balls

    ball = physics.Ball(random.uniform(64, width - 64), -16)
    ball.velocity = physics.Vector(random.uniform(-1, 1), 1 + random.uniform(0, 1))
    return [ball]


def generate_blocks(objects, width, height):
    objects.append(physics.Block(0, -64, 8, height))
    objects.append(physics.Block(width - 8, -64, width, height))
    objects.append(physics.Block(0, -68, width, -64))

    for x in range(128, width, 128):
        objects.append(physics.Block(x - 4, height - 32, x + 4, height))


def render_background(width, height):
    return Image.new("RGBA", (width, height), color="#353b48")


def centered_text(draw, x, y, text, font, fill="white"):
    tw, th = draw.textsize(text, font=font)
    draw.text((x - (tw / 2), y - (th / 2)), text, font=font, fill=fill)


def render_overlay(width, height):
    canvas = Image.new("RGBA", (width, height))
    draw = ImageDraw.Draw(canvas)

    # Pachinko Header
    font = DEFAULT_FONT40
    draw.rectangle((8, 0, width - 8, 48), fill="#70a1ff")
    centered_text(draw, width / 2, 24, "P  A  C  H  I  N  K  O", font)

    # Bins
    font = DEFAULT_FONT32
    draw.rectangle((8, height - 28, 124, height), fill=(232, 67, 147))
    centered_text(draw, 66, height - 14, "100", font)
    draw.rectangle((132, height - 28, 252, height), fill=(108, 92, 231))
    centered_text(draw, 192, height - 14, "1000", font)
    draw.rectangle((260, height - 28, width - 8, height), fill=(0, 206, 201))
    centered_text(draw, 322, height - 14, "200", font)
    return canvas


def all_balls_gone(balls, height):
    return all([ball.position.y > height for ball in balls])


def build_gif():
    HEIGHT = 512
    WIDTH = 384
    frames = []

    # Build the physics scene
    objects = []
    generate_pegs(objects, WIDTH, HEIGHT)
    generate_blocks(objects, WIDTH, HEIGHT)
    balls = generate_balls(objects, WIDTH)
    objects = objects + balls

    scene = physics.Scene(objects, gravity=physics.Vector(0, 0.25))

    # Setup the renderer
    background = render_background(WIDTH, HEIGHT)
    overlay = render_overlay(WIDTH, HEIGHT)

    physics_calcs_per_frame = 2
    step_number = 0
    while step_number < 2000 and not all_balls_gone(balls, HEIGHT):
        frame = background.copy()
        draw = ImageDraw.Draw(frame)
        scene.step(delta=0.4)
        step_number += 1

        if step_number % physics_calcs_per_frame == 0:
            scene.draw(draw)
            frame.alpha_composite(overlay)
            frames.append(frame)

    # Hang on before restarting
    durations = [20] * len(frames)
    durations[-1] = 1000

    # Save the gif to a file
    frames[0].save(
        "./output.gif",
        format="GIF",
        append_images=frames[1:],
        save_all=True,
        duration=durations,
        loop=0,
    )


if __name__ == "__main__":
    build_gif()
