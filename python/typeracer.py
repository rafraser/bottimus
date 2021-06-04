from PIL import Image, ImageDraw, ImageFont
import argparse
import textwrap


def generate_typeracer(text: str, output: str, fontname: str):
    """Generates and saves a Typeracer challenge image

    Arguments:
        text {str} -- Text to be displayed on the output image
        output {str} -- Filename to save to
        fontname {str} -- Fontname to be used to build
    """
    # Wrap text and calculate dimensions
    lines = textwrap.wrap(text, width=56)
    height = 16 + len(lines) * 16

    # Load the font
    font = ImageFont.truetype(f"./img/font/{fontname}.ttf", 16)

    # Draw the text onto the image
    im = Image.new("RGBA", (400, height), "#2C2F33")
    draw = ImageDraw.Draw(im)
    for i, line in enumerate(lines):
        draw.text((4, 4 + i * 16), line, font=font)

    # Save image to output file
    im.save(f"./img/{output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a Typeracer challenge image")
    parser.add_argument("text", help="Text to generate a challenge for")
    parser.add_argument(
        "--font",
        default="Quadrunde",
        help="Font to use for the output image. Must exist in ./img/fonts",
    )
    parser.add_argument(
        "--output",
        default="typeracer.png",
        help="Output filename (include file extension)",
    )
    args = parser.parse_args()
    generate_typeracer(args.text, args.output, args.font)
