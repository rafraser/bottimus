from PIL import Image, ImageDraw, ImageFont
import sys
import textwrap

# Load words from arguments
words = sys.argv[1]
words = textwrap.wrap(words, width=56)
height = 16 + len(words) * 16

# Load font from file
font = ImageFont.truetype('./img/font/Quadrunde.ttf', 16)

# Draw the text on the image
im = Image.new('RGBA', (400, height), '#2C2F33')
draw = ImageDraw.Draw(im)
for i in range(len(words)):
    draw.text((4, 4 + i*16), words[i], font=font)
    
im.save('./img/typeracer.png')