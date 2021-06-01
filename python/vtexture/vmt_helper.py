import os
import requests
import zipfile


def check_vtfcmd_exists():
    # TODO: Download VTFCmd if it doesn't exist
    directory = "./vtflib"
    script_location = os.path.join(directory, "vtfcmd.exe")
    if os.path.isfile(script_location):
        return script_location
    else:
        # Download and extract VTFCmd
        raise ValueError("VTFCmd is not installed!")


def convert_folder_to_vtf(png_directory, vtf_directory):
    vtfcmd_path = check_vtfcmd_exists()

    # Run VTFCmd on the paths as specified
