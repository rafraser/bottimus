# pyright: reportMissingImports=false, reportMissingModuleSource=false
import os
import requests
import zipfile


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

    # Run VTFCmd on the paths as specified
