import math
import sys
from PIL import Image, ImageDraw, ImageFont

prizes = ['bowlingpin', 'cards', 'chocolate', 'coin', 'dice', 'drum', 'toxicdrum', 'fox', 'icefox', 'gamebro', 'gamebrocolor', 'goldmonitor', 'monitor', 'oldbarrel', 'mysteryorb', 'pluto', 'purplerocket', 'redrocket', 'bluerocket', 'greenrocket']
background = Image.open('./img/frame.png').resize((126, 126))

def silhoutte(image):
    pixels = image.load()
    for yy in range(1, image.height-1):
        for xx in range(1, image.width-1):
            # Check corners
            a = pixels[(xx, yy)][3]
            a2 = pixels[(xx+1, yy)][3] == 0
            a3 = pixels[(xx, yy+1)][3] == 0
            a4 = pixels[(xx+1, yy+1)][3] == 0
            if a == 255 and (a4 or (a2 and a3)):
                pixels[(xx, yy)] = (127, 112, 94, 255)
            elif a == 255:
                pixels[(xx, yy)] = (61, 42, 52, 255)
                
    return image

def renderSquare(prize=None, locked=False):
    canvas = Image.new('RGB', (126, 126))
    canvas.paste(background)
    
    if prize:
        prize_image = Image.open('./img/prizes/' + prize + '.png')
        if locked:
            prize_image = silhoutte(prize_image)
        
        prize_image = prize_image.resize((96, 96))
        canvas.paste(prize_image, (15, 15), prize_image)
    
    return canvas

def renderInventory(items): 
    row_size = 5
    num_rows = math.ceil(len(prizes)/row_size)
    
    # Create the canvas
    inventory = Image.new('RGB', (126*row_size, 126*num_rows))
    font = ImageFont.truetype('./img/font/disco.ttf', 16)
    draw = ImageDraw.Draw(inventory)
    
    for xx in range(0, row_size):
        for yy in range(0, num_rows):
            i = xx + (row_size * yy)
            p = None
            if i < len(prizes):
                p = prizes[i]
            
            amount = items.get(p, 0)
            inventory.paste(renderSquare(p, amount < 1), (126*xx, 126*yy))
            
            if amount > 0:
                tw, th = draw.textsize(str(amount), font=font)
                draw.text((126*xx + 114 - tw, 126*yy + 114 - th), str(amount), font=font, fill=(189, 195, 199))
    
    inventory = inventory.resize((inventory.width * 3, inventory.height*3))
    inventory.save('./img/inventory.png')
    
if __name__ == '__main__':
    args = sys.argv[1:]
    items = {}
    for arg in args:
        arg = arg.split(':')
        items[arg[0]] = int(arg[1])
    renderInventory(items)