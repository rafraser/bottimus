from dataclasses import dataclass
from typing import List, Optional, Tuple, Union
import itertools
import random

import physics
from layouts import Bin, BIN_LAYOUTS

WIDTH = 480
HEIGHT = 480

PEG_JITTER = 6
PEG_SKIP_CHANCE = 0.12

DROP_X_JITTER = 10
DROP_Y_STAGGER = 15

GRAVITY = 0.25
MAX_STEPS = 2000
STEP_DELTA = 0.4

BIN_MARGIN = 8
BIN_GAP = 8


def pick_layout(seed: int) -> Tuple[str, List[Bin]]:
    rng = random.Random(seed)
    return rng.choice(list(BIN_LAYOUTS.items()))


def compute_bin_bounds(
    width: float, bins: List[Bin], margin: float = BIN_MARGIN, gap: float = BIN_GAP
) -> List[Tuple[float, float]]:
    n = len(bins)
    usable = width - 2 * margin - gap * (n - 1)
    total_size = sum(b.size for b in bins)

    bounds = []
    x = margin
    for b in bins:
        bin_width = usable * b.size / total_size
        bounds.append((x, x + bin_width))
        x += bin_width + gap
    return bounds


def bin_index(x: float, bounds: List[Tuple[float, float]]) -> int:
    for i, (start, end) in enumerate(bounds):
        if start <= x < end:
            return i
    return 0 if x < bounds[0][0] else len(bounds) - 1


def resolve_ball(ball: "physics.Ball", bins: List[Bin], width: float, height: float) -> Optional[Bin]:
    if ball.position.y <= height:
        return None
    bounds = compute_bin_bounds(width, bins)
    return bins[bin_index(ball.position.x, bounds)]


DROP_COUNT = 5
DROP_MARGIN = 64


def compute_drop_columns(width: float, n: int = DROP_COUNT, margin: float = DROP_MARGIN) -> List[float]:
    step = (width - 2 * margin) / (n - 1)
    return [round(margin + i * step) for i in range(n)]


DROP_COLUMNS = compute_drop_columns(WIDTH)


def generate_pegs(rng: random.Random, objects: list, width: float, height: float) -> None:
    row_spacing, col_spacing = 128, 64

    for x, y in itertools.product(list(range(64, width, col_spacing)), range(row_spacing, height, row_spacing)):
        if rng.random() < PEG_SKIP_CHANCE:
            continue
        jx = x + rng.uniform(-PEG_JITTER, PEG_JITTER)
        jy = y + rng.uniform(-PEG_JITTER, PEG_JITTER)
        objects.append(physics.Peg(jx, jy, 8))

    for x, y in itertools.product(
        list(range(32, width + 64, col_spacing)),
        range(row_spacing + 64, height - 64, row_spacing),
    ):
        if rng.random() < PEG_SKIP_CHANCE:
            continue
        jx = x + rng.uniform(-PEG_JITTER, PEG_JITTER)
        jy = y + rng.uniform(-PEG_JITTER, PEG_JITTER)
        objects.append(physics.Peg(jx, jy, 8))


def generate_blocks(objects: list, width: float, height: float, bins: List[Bin]) -> None:
    objects.append(physics.Block(0, -64, 8, height))
    objects.append(physics.Block(width - 8, -64, width, height))
    objects.append(physics.Block(0, -68, width, -64))

    bounds = compute_bin_bounds(width, bins)
    for (_, end), (start, _) in zip(bounds, bounds[1:]):
        sep_x = (end + start) / 2
        objects.append(physics.Block(sep_x - 4, height - 32, sep_x + 4, height))


@dataclass
class BallSpec:
    column: Union[int, float]
    color: Optional[str] = None
    initial: Optional[str] = None


BallLike = Union[BallSpec, int, float]


def _as_ball_spec(entry: BallLike) -> BallSpec:
    return entry if isinstance(entry, BallSpec) else BallSpec(column=entry)


def generate_ball(rng: random.Random, ball: BallLike, y_stagger: float = 0) -> "physics.Ball":
    spec = _as_ball_spec(ball)
    base_x = DROP_COLUMNS[spec.column] if isinstance(spec.column, int) else spec.column
    start_x = base_x + rng.uniform(-DROP_X_JITTER, DROP_X_JITTER)
    start_y = -16 - (rng.uniform(0, y_stagger) if y_stagger else 0)

    obj = physics.Ball(start_x, start_y, color=spec.color)
    obj.initial = spec.initial
    obj.velocity = physics.Vector(rng.uniform(-1, 1), 1 + rng.uniform(0, 1))
    return obj


def generate_balls(rng: random.Random, balls: List[BallLike], y_stagger: float = 0) -> List["physics.Ball"]:
    return [generate_ball(rng, ball, y_stagger=y_stagger) for ball in balls]


def all_balls_gone(balls: List["physics.Ball"], height: float) -> bool:
    return all(ball.position.y > height for ball in balls)
