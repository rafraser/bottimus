# pyright: reportMissingImports=false, reportMissingModuleSource=false
import os
import requests
import zipfile
import subprocess
import ntpath


def path_relative_to_materials(path):
    """Given a complicated path, produce the path relative to materials/
    If materials/ is not contained in the path, returns the input unchanged

    Examples:
        materials/12.png                -> 12.png
        test/materials/example/12.png   -> example/12.png
        test/nothing/12.png             -> test/nothing/12.png

    Args:
        path (str): Full path

    Returns:
        (str): Path relative to materials
    """
    split_path = path.split(os.sep)
    try:
        mat_index = split_path.index("materials") + 1
        return os.path.join(*split_path[mat_index:])
    except ValueError:
        return path


def process_vmt_template(vmt_template, base_name, color_name, vtf_dir):
    """Process a VMT template, producing a new VMT in the given directory

    Args:
        vmt_template (list(str)): Contents of the template VMT. Should be a list of strings.
        base_name (str): Name of the base texture used
        color_name (str): Name of the color used in this template
        vtf_dir (str): Path for output files
    """
    vmt_path = os.path.join(vtf_dir, f"{base_name}_{color_name}.vmt")

    vtf_subdir = path_relative_to_materials(vtf_dir)
    vtf_path = os.path.join(vtf_subdir, f"{base_name}_{color_name}")
    with open(vmt_path, "w") as f:
        for line in vmt_template:
            line = line.replace("{{VTF_PATH}}", vtf_path)
            line = line.replace("{{VTF_DIRECTORY}}", vtf_subdir)
            line = line.replace("{{COLOR_NAME}}", color_name)
            f.write(line)


def check_vtfcmd_exists():
    """Return the path to VTFCmd
    If VTFCmd is not installed, this script will attempt to install it next to this script

    Raises:
        RuntimeError: If VTFCmd is not installed & the installation process failed

    Returns:
        str: Path to VTFCmd.exe
    """
    directory = "./python/vtexture/vtflib/bin/x64"
    script_location = os.path.join(directory, "VTFCmd.exe")
    if os.path.isfile(script_location):
        return script_location
    else:
        try:
            # Downloading VTFCmd in zip format.
            url = 'http://nemstools.github.io/files/vtflib132-bin.zip'
            r = requests.get(url, allow_redirects=True)
            open('./python/vtexture/vtflib.zip', 'wb').write(r.content)

            # Unzipping File
            with zipfile.ZipFile("./python/vtexture/vtflib.zip", "r") as zip_ref:
                zip_ref.extractall("./python/vtexture/vtflib")

            # Deleting the ZIP file
            os.remove("./python/vtexture/vtflib.zip")
        except Exception:
            raise RuntimeError("Failed to install")


def convert_file_to_vtf(input_file, vtf_dir, format="DXT1", extra_args=[]):
    """Convert a single file into a .VTF

    Args:
        input_file (str): Path to the input file, including extension.
        vtf_dir (str): Output directory.
        format (str): Image format to use. Defaults to DXT1.
    """
    vtfcmd_path = check_vtfcmd_exists()
    if os.name == "posix":
        # Run using wine
        input_file = input_file.replace(os.sep, ntpath.sep)
        subprocess.run(["wine", vtfcmd_path, "-file", input_file,
                       "-output", vtf_dir, "-format", format, "-silent"])
    else:
        subprocess.run([vtfcmd_path, "-file", input_file,
                       "-output", vtf_dir, "-format", format, "-silent"] + extra_args)


def convert_folder_to_vtf(png_dir, vtf_dir, format="DXT1", extra_args=[]):
    """Convert a directory of .PNGs into .VTFs

    Note that VTFCmd is a windows specific executable.
    If running on a non-windows system, this script will attempt to use Wine

    Args:
        png_dir (str): Path to folder containing input PNGs.
        vtf_dir (str): Output directory.
        format  (str): Image format to use. Defaults to DXT1.
    """
    vtfcmd_path = check_vtfcmd_exists()
    png_dir = os.path.join(png_dir, "*.png")
    if os.name == "posix":
        # Run using wine
        png_dir = png_dir.replace(os.sep, ntpath.sep)
        subprocess.run(["wine", vtfcmd_path, "-folder",
                       png_dir, "-output", vtf_dir, "-format", "DXT1", "-silent"])
    else:
        subprocess.run([vtfcmd_path, "-folder", png_dir,
                       "-output", vtf_dir, "-format", format, "-silent"])
