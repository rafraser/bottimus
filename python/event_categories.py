import json

# List of colors
COLORS = {
    "yellow": ((251, 197, 49), (225, 177, 44)),
    "purple": ((156, 136, 255), (140, 122, 230)),
    "blue": ((0, 168, 255), (0, 151, 230)),
    "red": ((232, 65, 24), (194, 54, 22)),
    "green": ((76, 209, 55), (68, 189, 50)),
    "orange": ((255, 190, 118), (240, 147, 43)),
    "white": ((245, 246, 250), (220, 221, 225)),
    "pink": ((255, 159, 243), (243, 104, 224)),
    #
    "Common": ((76, 209, 55), (68, 189, 50)),
    "Uncommon": ((0, 168, 255), (0, 151, 230)),
    "Rare": ((156, 136, 255), (140, 122, 230)),
    "Legendary": ((255, 190, 118), (240, 147, 43)),
}


def categories():
    with open("event_categories.json") as f:
        return json.loads(f.read())
