# pyright: reportMissingImports=false, reportMissingModuleSource=false
import os
import requests
import zipfile
import subprocess


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
            line = line.replace("{{VTF_DIRECTORY}}", vtf_dir)
            line = line.replace("{{COLOR_NAME}}", color_name)
            f.write(line)


def check_vtfcmd_exists():

    directory = "./python/vtexture/vtflib/bin/x86"
    script_location = os.path.join(directory, "VTFCmd.exe")
    if os.path.isfile(script_location):
        print("VTFCmd is installed!")
        return script_location
    else:
        print("VTFCmd is not installed!\n" + "Proceeding to Installing VTFCmd")

        try:
            # Downloading VTFCmd in zip format.
            url = 'http://nemstools.github.io/files/vtflib132-bin.zip'
            r = requests.get(url, allow_redirects=True)
            open('./python/vtexture/vtflib.zip', 'wb').write(r.content)

            # Unzipping File
            with zipfile.ZipFile("./python/vtexture/vtflib.zip","r") as zip_ref: 
                zip_ref.extractall("./python/vtexture/vtflib")

            # Deleting the ZIP file
            os.remove("./python/vtexture/vtflib.zip")

            print("Successfully Installed VTFCmd")

        except:
            print("Failed to Install VTFCmd")


def convert_folder_to_vtf(png_directory, vtf_directory):

    vtfcmd_path = check_vtfcmd_exists()

    png_directory = os.path.join(png_directory, "*.png")

    subprocess.run([vtfcmd_path, "-folder", png_directory, "-output", vtf_directory, "-resize"])

    # Run VTFCmd on the paths as specified

