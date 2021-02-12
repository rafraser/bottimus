from PIL import Image, ImageDraw
import math
import random
import itertools


class Vector(object):
    def __init__(self, x=0, y=0):
        self.x, self.y = x, y

    def __add__(self, other):
        if isinstance(other, Vector):
            return Vector(self.x + other.x, self.y + other.y)
        elif isinstance(other, tuple):
            return Vector(self.x + other[0], self.y + other[0])

    def __sub__(self, other):
        return Vector(self.x - other.x, self.y - other.y)

    def __mul__(self, other):
        if isinstance(other, Vector):
            return self.dot(other)
        elif isinstance(other, (int, float)):
            return Vector(self.x * other, self.y * other)

    def dot(self, other):
        return (self.x * other.x) + (self.y * other.y)

    def magnitude(self):
        return math.hypot(self.x, self.y)

    def normalize(self):
        norm = self.magnitude()
        return Vector(self.x / norm, self.y / norm)


class Ball(object):
    color = "#e84118"
    bounciness = 0.65

    def __init__(self, x, y, r):
        self.position = Vector(x, y)
        self.velocity = Vector(0, 0)
        self.radius = r

    def tick(self):
        self.velocity = self.velocity + GRAVITY
        self.position = self.position + self.velocity

        if self.position.x < 0:
            self.position.x = 0
            self.velocity = Vector(-self.velocity.x, self.velocity.y)
        elif self.position.x > SIZE:
            self.position.x = SIZE
            self.velocity = Vector(-self.velocity.x, self.velocity.y)

    def draw(self, draw):
        x, y = self.position.x, self.position.y
        r = self.radius
        draw.ellipse((x - r, y - r, x + r, y + r), fill=self.color)


BG_COLOR = "#353b48"
BALL_COLOR = "#e84118"
PEG_COLOR = "#718093"
GRAVITY = Vector(0, 0.5)
SIZE = 512


def simulation_step(ball, pegs):
    ball.tick()

    # Collision check
    for peg in pegs:
        pegpos = Vector(peg[0], peg[1])
        diff = ball.position - pegpos
        distance = diff.magnitude()

        if distance <= ball.radius + peg[2]:
            normal = (ball.position - pegpos).normalize()
            reflection = ball.velocity - normal * (ball.velocity.dot(normal) * 2)
            ball.velocity = reflection * ball.bounciness
            ball.position = ball.position + diff * 0.5


def render_peg(draw, peg):
    x = peg[0]
    y = peg[1]
    r = peg[2]
    draw.ellipse((x - r, y - r, x + r, y + r), fill=PEG_COLOR)


def render_scene(draw, ball, pegs):
    ball.draw(draw)

    for peg in pegs:
        render_peg(draw, peg)


def build_gif():
    frames = []
    pegs = [
        (x, y, 4)
        for (x, y) in itertools.product(list(range(64, 512, 64)), range(128, 512, 128))
    ] + [
        (x - 32, y, 4)
        for (x, y) in itertools.product(list(range(64, 576, 64)), range(192, 512, 128))
    ]

    ball = Ball(48 + random.uniform(-10, 10), 10, 16)
    for i in range(240):
        frame = Image.new("RGBA", (512, 512), color=BG_COLOR)
        draw = ImageDraw.Draw(frame)
        simulation_step(ball, pegs)

        render_scene(draw, ball, pegs)
        frames.append(frame)

    # Save the gif to a file
    frames[0].save(
        f"./output.gif",
        format="GIF",
        append_images=frames[1:],
        save_all=True,
        duration=20,
        loop=0,
    )


if __name__ == "__main__":
    build_gif()
