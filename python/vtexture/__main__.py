# pyright: reportMissingImports=false, reportMissingModuleSource=false
import argparse
import math
import os
import time

import vmt_helper
from PIL import Image
from theia.palettes import load_or_download_palette


def timestamp() -> str:
    """String timestamp, suitable for folder names

    Returns:
        str: Timestamp, in a friendly string format
    """
    return str(math.floor(time.time()))


def load_image_components(name: str):
    """Load a base image and any addition components into a dictionary

    This will look for the following files:
        name.png            -- Base Image

    Args:
        name (str): Base image name
    """
    directory = "./img/vtexture_input/"
    options = []

    result = {"base": Image.open(os.path.join(directory, f"{name}.png")).convert("RGBA")}
    for ext in options:
        image_path = os.path.join(directory, f"{name}.png")
        if os.path.isfile(image_path):
            result[ext] = Image.open(image_path).convert("RGBA")

    return result


def validate_components(components: dict):
    # Check that all image components have the same dimensions
    size = None
    for img in components.values():
        if size and img.size != size:
            raise ValueError("Image components must have the same dimensions!")
        else:
            size = img.size


def process(palette: str):
    # Load the color palette
    colors = load_or_download_palette(palette, save=True)
    print(colors)

    # Create output directory
    out_dir = os.path.join("./img/vtexture_output/", timestamp())
    os.makedirs(out_dir, exist_ok=True)

    images_to_process = ["grid"]
    for image in images_to_process:
        components = load_image_components(image)
        validate_components(components)

        for name, color in colors.items():
            pass

    vmt_helper.convert_folder_to_vtf(out_dir)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="")
    parser.add_argument("palette", help="Color palette to use")
    args = parser.parse_args()

    process(palette=args.palette)
