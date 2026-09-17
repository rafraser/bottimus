from PIL import Image, ImageDraw, ImageFont
from PIL.Image import Image as ImageType
from typing import Any, Dict, List, Optional, Set, Tuple
import random

import physics
from board import (
    Bin,
    BallLike,
    WIDTH,
    HEIGHT,
    GRAVITY,
    MAX_STEPS,
    STEP_DELTA,
    DROP_Y_STAGGER,
    DROP_COLUMNS,
    BIN_LAYOUTS,
    compute_bin_bounds,
    generate_pegs,
    generate_blocks,
    generate_balls,
    all_balls_gone,
    resolve_ball,
    _as_ball_spec,
)

DEFAULT_FONT40 = ImageFont.truetype("img/font/disco.ttf", 40)
DEFAULT_FONT32 = ImageFont.truetype("img/font/disco.ttf", 32)
DEFAULT_FONT20 = ImageFont.truetype("img/font/disco.ttf", 20)

PHYSICS_CALCS_PER_FRAME = 2


def centered_text(
    draw: ImageDraw.ImageDraw, x: float, y: float, text: str, font: ImageFont.FreeTypeFont, fill: str = "white"
) -> None:
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    tw, th = right - left, bottom - top
    draw.text((x - (tw / 2) - left, y - (th / 2) - top), text, font=font, fill=fill)


def render_background(width: float, height: float, selected_columns: Optional[Set[int]] = None) -> ImageType:
    canvas = Image.new("RGBA", (width, height), color="#353b48")
    draw = ImageDraw.Draw(canvas)

    font = DEFAULT_FONT20
    for i, x in enumerate(DROP_COLUMNS):
        active = selected_columns is not None and i in selected_columns
        fill = (255, 209, 102) if active else (100, 106, 113)
        draw.ellipse((x - 14, 54, x + 14, 82), fill=fill)
        centered_text(draw, x, 68, str(i + 1), font, fill="#2d3436")

    return canvas


def render_overlay(width: float, height: float, bins: List[Bin]) -> ImageType:
    canvas = Image.new("RGBA", (width, height))
    draw = ImageDraw.Draw(canvas)

    font = DEFAULT_FONT40
    draw.rectangle((8, 0, width - 8, 48), fill="#70a1ff")
    centered_text(draw, width / 2, 24, "P  A  C  H  I  N  K  O", font)

    # Bins - font shrinks a little once there are more than 3 of them
    font = DEFAULT_FONT32 if len(bins) <= 3 else DEFAULT_FONT20
    for (start, end), b in zip(compute_bin_bounds(width, bins), bins):
        draw.rectangle((start, height - 28, end, height), fill=b.color)
        centered_text(draw, (start + end) / 2, height - 14, str(b.value), font)
    return canvas


def render_ball_labels(
    draw: ImageDraw.ImageDraw, balls: List["physics.Ball"], font: Optional[ImageFont.FreeTypeFont] = None
) -> None:
    font = font or DEFAULT_FONT20
    for ball in balls:
        if ball.initial:
            centered_text(draw, ball.position.x, ball.position.y, ball.initial, font, fill="white")


def build_preview(
    seed: Optional[int] = None, filename: str = "./preview.png", layout: Optional[str] = None
) -> Tuple[int, str, List[Bin]]:
    if seed is None:
        seed = random.randrange(2**32)
    rng = random.Random(seed)

    if layout is not None:
        layout_name, bins = layout, BIN_LAYOUTS[layout]
    else:
        layout_name, bins = rng.choice(list(BIN_LAYOUTS.items()))

    objects: List[Any] = []
    generate_pegs(rng, objects, WIDTH, HEIGHT)
    generate_blocks(objects, WIDTH, HEIGHT, bins)

    background = render_background(WIDTH, HEIGHT, selected_columns=None)
    overlay = render_overlay(WIDTH, HEIGHT, bins)

    frame = background.copy()
    draw = ImageDraw.Draw(frame)
    for obj in objects:
        obj.draw(draw)
    frame.alpha_composite(overlay)
    frame.save(filename)

    return seed, layout_name, bins


def build_gif(
    seed: Optional[int] = None,
    balls: Optional[List[BallLike]] = None,
    ball_collisions: bool = True,
    filename: str = "./output.gif",
    layout: Optional[str] = None,
) -> Tuple[int, list, Dict[str, Any]]:
    if seed is None:
        seed = random.randrange(2**32)
    rng = random.Random(seed)
    if balls is None:
        balls = [rng.randrange(len(DROP_COLUMNS))]
    ball_specs = [_as_ball_spec(b) for b in balls]

    if layout is not None:
        layout_name, bins = layout, BIN_LAYOUTS[layout]
    else:
        layout_name, bins = rng.choice(list(BIN_LAYOUTS.items()))

    frames = []

    objects: List[Any] = []
    generate_pegs(rng, objects, WIDTH, HEIGHT)
    generate_blocks(objects, WIDTH, HEIGHT, bins)
    balls = generate_balls(rng, ball_specs, y_stagger=DROP_Y_STAGGER if len(ball_specs) > 1 else 0)
    objects = objects + balls

    scene = physics.Scene(objects, gravity=physics.Vector(0, GRAVITY), ball_collisions=ball_collisions)

    selected_columns = {spec.column for spec in ball_specs if isinstance(spec.column, int)}
    background = render_background(WIDTH, HEIGHT, selected_columns=selected_columns)
    overlay = render_overlay(WIDTH, HEIGHT, bins)

    # track balls as soon as they exit
    resolved_bins: List[Optional[Bin]] = [None] * len(balls)

    step_number = 0
    while step_number < MAX_STEPS and not all_balls_gone(balls, HEIGHT):
        frame = background.copy()
        draw = ImageDraw.Draw(frame)
        scene.step(delta=STEP_DELTA)
        step_number += 1

        for idx, ball in enumerate(balls):
            if resolved_bins[idx] is None and ball.position.y > HEIGHT:
                resolved_bins[idx] = resolve_ball(ball, bins, WIDTH, HEIGHT)

        if step_number % PHYSICS_CALCS_PER_FRAME == 0:
            scene.draw(draw)
            render_ball_labels(draw, balls)
            frame.alpha_composite(overlay)
            frames.append(frame)

    # Hang on before restarting
    durations = [20] * len(frames)
    durations[-1] = 1000

    frames[0].save(
        filename,
        format="GIF",
        append_images=frames[1:],
        save_all=True,
        duration=durations,
        loop=0,
    )

    columns = [spec.column + 1 for spec in ball_specs if isinstance(spec.column, int)]
    print(f"seed={seed} columns={columns} ball_collisions={ball_collisions} bin_layout={layout_name}")

    # stuck balls count as nothing - sorry
    ball_results = []
    for spec, resolved in zip(ball_specs, resolved_bins):
        ball_results.append(
            {
                "column": spec.column + 1 if isinstance(spec.column, int) else spec.column,
                "value": resolved.value if resolved else 0,
            }
        )

    result = {"seed": seed, "layout": layout_name, "balls": ball_results}
    return seed, ball_specs, result
