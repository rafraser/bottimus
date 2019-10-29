from PIL import Image, ImageDraw, ImageFont
import math
import sys

# List of colors
colors = {}
colors['yellow'] = ((251, 197, 49), (225, 177, 44))
colors['purple'] = ((156, 136, 255), (140, 122, 230))
colors['blue'] = ((0, 168, 255), (0, 151, 230))
colors['red'] = ((232, 65, 24), (194, 54, 22))
colors['green'] = ((76, 209, 55), (68, 189, 50))
colors['orange'] = ((255, 190, 118), (240, 147, 43))
colors['white'] = ((245, 246, 250), (220, 221, 225))

colors['Rare'] = ((156, 136, 255), (140, 122, 230))
colors['Uncommon'] = ((0, 168, 255), (0, 151, 230))
colors['Common'] = ((76, 209, 55), (68, 189, 50))
colors['Legendary'] = ((255, 190, 118), (240, 147, 43))

def generate_frame(offset=0, color='yellow'):
    # Setup the canvas
    c = colors[color]
    canvas = Image.new('RGBA', (768, 768), c[0])
    draw = ImageDraw.Draw(canvas)
    n = 5
    q = 360/(2*n)
    
    # Render each 'beam' of the sunbeam effect
    for i in range(n):
        startang = offset + 2*(i-1)*q
        endang = offset + (2*(i-1) + 1)*q
        draw.pieslice((0, 0, 768, 768), startang, endang, fill=c[1])
    
    # Crop to the center 512x
    c2 = canvas.crop((128, 128, 640, 640))
    return c2
    
def render_award(image, color, toptext, bottomtext):
    prize = Image.open('./img/' + image + '.png').resize((256, 256))
    font = ImageFont.truetype('./img/font/disco.ttf', 52)
    mid = math.floor(256/2)
    
    frames = []
    for i in range(60):
        img = generate_frame(i * (72/60), color)
        img.paste(prize, (mid, mid), prize)
        textcolor = (255, 255, 255)
        if color == 'white':
            textcolor = (0, 0, 0)
        
        if toptext != None:
            draw = ImageDraw.Draw(img)
            tw, th = draw.textsize(toptext, font=font)
            draw.text(((512-tw)/2, 48 - (th/2)), toptext, font=font, fill=textcolor)
        
            tw, th = draw.textsize(bottomtext, font=font)
            draw.text(((512-tw)/2, 512 - 48 - (th/2)), bottomtext, font=font, fill=textcolor)
        
        frames.append(img)
    frames[0].save('./img/sunbeam.gif', format='GIF', append_images=frames[1:], save_all=True, duration=20, loop=0)
    
if __name__ == '__main__':
    image = sys.argv[1]
    color = sys.argv[2]
    toptext = sys.argv[3]
    bottomtext = sys.argv[4]
    render_award(image, color, toptext, bottomtext)