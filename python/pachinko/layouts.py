from dataclasses import dataclass
from typing import Tuple


@dataclass
class Bin:
    size: int
    color: Tuple[int, int, int]
    value: int

    def __post_init__(self) -> None:
        self.value = round(self.value / 5) * 5


ORANGE = (255, 159, 67)
PINK = (232, 67, 147)
PURPLE = (108, 92, 231)
TEAL = (0, 206, 201)
RED = (235, 77, 75)

PRICE = 250

BIN_LAYOUTS = {
    "1-2-1": [Bin(1, ORANGE, PRICE * 2), Bin(2, PURPLE, PRICE * 0.3), Bin(1, ORANGE, PRICE * 2)],
    "danger-zone": [
        Bin(1, RED, 0),
        Bin(1, ORANGE, PRICE * 4),
        Bin(1, RED, 0),
        Bin(2, TEAL, PRICE),
        Bin(1, RED, 0),
        Bin(1, ORANGE, PRICE * 4),
        Bin(1, RED, 0),
    ],
    "fibonacci": [
        Bin(1, ORANGE, PRICE * 2.3),
        Bin(2, PURPLE, PRICE),
        Bin(3, TEAL, PRICE * 0.5),
        Bin(2, PURPLE, PRICE),
        Bin(1, ORANGE, PRICE * 2.3),
    ],
    "the-vortex": [
        Bin(1, ORANGE, PRICE * 3.5),
        Bin(2, PURPLE, PRICE * 1.5),
        Bin(4, RED, PRICE * 0.1),
        Bin(2, PURPLE, PRICE * 1.5),
        Bin(1, ORANGE, PRICE * 3.5),
    ],
    "triple-threat": [
        Bin(1, ORANGE, PRICE * 3.0),
        Bin(3, TEAL, PRICE * 0.6),
        Bin(3, ORANGE, PRICE * 1.5),
        Bin(3, TEAL, PRICE * 0.6),
        Bin(1, ORANGE, PRICE * 3.0),
    ],
    "jackpot-chaser": [
        Bin(4, PURPLE, PRICE * 0.7),
        Bin(1, ORANGE, PRICE * 5.0),
        Bin(4, PURPLE, PRICE * 0.7),
    ],
    "asymmetric-slider": [
        Bin(3, TEAL, PRICE * 1.2),
        Bin(2, PURPLE, PRICE * 0.8),
        Bin(1, RED, 0),
        Bin(1, ORANGE, PRICE * 4.0),
    ],
}
