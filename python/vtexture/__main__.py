# pyright: reportMissingImports=false, reportMissingModuleSource=false
import argparse
import math
import os
import shutil
import time

import vmt_helper
from PIL import Image
from theia.color import Color
from theia.palettes import load_or_download_palette
from theia.channels import multiply

INPUT_DIRECTORY = os.path.join("img", "vtexture_input")
IMAGE_SETS = {"default": ["grid"]}


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
        name_overlay.png    -- Overlay

    Args:
        name (str): Base image name
    """
    base_image = Image.open(os.path.join(INPUT_DIRECTORY, f"{name}.png"))
    result = {"base": base_image.convert("RGBA")}

    options = ["overlay"]
    for ext in options:
        image_path = os.path.join(INPUT_DIRECTORY, f"{name}_{ext}.png")
        if os.path.isfile(image_path):
            result[ext] = Image.open(image_path).convert("RGBA")

    return result


def validate_components(components: dict):
    """Check that all image components have the same dimensions
    For the colorizing process to work properly, it's crucial that everything matches up

    Args:
        components (dict): Dictionary of images

    Raises:
        ValueError: if any image has incorrect dimensions
    """
    # Check that all image components have the same dimensions
    size = None
    for img in components.values():
        if size and img.size != size:
            raise ValueError("Image components must have the same dimensions!")
        else:
            size = img.size


def colorize_components(components: dict, color: Color) -> Image:
    """Colorize a dictionary of image components

    Args:
        components (dict): Dictionary of images
        color (Color): Color to apply to this set of components

    Returns:
        Image: recolored and combined images
    """
    # Recolorize the base layer
    canvas = components.get("base").copy()
    canvas = multiply(canvas, color)

    # Stick overlays on top of the final results
    if overlay := components.get("overlay"):
        canvas.alpha_composite(overlay)

    return canvas


def process(palette: str):
    # Load the color palette
    colors = load_or_download_palette(palette, save=True)
    print("Loaded palette", palette, "with", len(colors), "colors")

    # Create output directory
    out_dir = os.path.join("img", "vtexture_output", timestamp())
    png_dir = os.path.join(out_dir, "png")
    os.makedirs(png_dir, exist_ok=True)

    vtf_dir = os.path.join(out_dir, "materials\\vtf")
    os.makedirs(vtf_dir, exist_ok=True)

    images_to_process = IMAGE_SETS.get("default")

    for image in images_to_process:
        # Load any component files that make up this image
        # This includes base maps, overlays, etc.
        print("Recolorizing:", image)
        components = load_image_components(image)
        validate_components(components)

        # Load the template VMT
        with open(os.path.join(INPUT_DIRECTORY, f"{image}.vmt")) as f:
            vmt = f.readlines()

        for name, color in colors.items():
            # Generate a colorized image for each color in the palette
            colorized_image = colorize_components(components, color)
            colorized_image.save(os.path.join(png_dir, f"{image}_{name}.png"))

            # Additionally, generate a .vmt for each image
            vmt_helper.process_vmt_template(vmt, image, name, vtf_dir)

    # Colorized versions have all been generated - convert the folder to VTF
    vmt_helper.convert_folder_to_vtf(png_dir, vtf_dir)

    # Zip up the results and return the path
    shutil.make_archive(out_dir, "zip", out_dir)
    return out_dir + ".zip"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="")
    parser.add_argument("palette", help="Color palette to use")
    args = parser.parse_args()

    # Print output location to stdout
    zip_path = process(palette=args.palette)
    print(zip_path)
