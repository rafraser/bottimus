import argparse
import json
from typing import List

from board import Bin, BallSpec
from render import build_gif, build_preview


def bins_payload(bins: List[Bin]) -> List[dict]:
    return [{"size": b.size, "value": b.value, "color": "#%02x%02x%02x" % b.color} for b in bins]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a pachinko drop")
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Seed for reproducible board + drop; randomly generated (and reported back) if omitted",
    )
    parser.add_argument(
        "--column",
        type=int,
        nargs="+",
        default=None,
        help="Drop slot(s), 1-indexed; repeat a slot to drop multiple balls from it",
    )
    parser.add_argument(
        "--initials", type=str, nargs="+", default=None, help="One initial per --column entry, e.g. --initials A B C"
    )
    parser.add_argument(
        "--colors",
        type=str,
        nargs="+",
        default=None,
        help="One fill colour per --column entry, e.g. --colors '#e84393' '#0984e3'",
    )
    parser.add_argument("--out", default=None, help="Output path (GIF for play mode, PNG for --preview)")
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Render just the static board (pegs + bins, no balls) instead of the full animated drop",
    )
    args = parser.parse_args()

    if args.preview:
        seed, layout_name, bins = build_preview(seed=args.seed, filename=args.out or "./preview.png")
        print(json.dumps({"seed": seed, "layout": layout_name, "bins": bins_payload(bins)}))
    else:
        balls = None
        if args.column:
            initials = args.initials or [None] * len(args.column)
            colors = args.colors or [None] * len(args.column)
            balls = [BallSpec(column=c - 1, initial=i, color=col) for c, i, col in zip(args.column, initials, colors)]
        _, _, result = build_gif(seed=args.seed, balls=balls, filename=args.out or "./output.gif")
        print(json.dumps(result))
