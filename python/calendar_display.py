from PIL import Image, ImageDraw, ImageFont
import datetime
import calendar
import math
import sys

# Load fonts from file
font_bold = ImageFont.truetype("./img/font/Montserrat-Black.ttf", 48)
font_medium = ImageFont.truetype("./img/font/Montserrat-Black.ttf", 32)
font_light = ImageFont.truetype("./img/font/Montserrat-Regular.ttf", 24)

# Sizing properties
box_width = 250
box_height = 150
padding = 12
margin = 128

# Day names for the header
day_names = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

# Background colours for the events
background_colors = {"music": "#f368e0", "generic": "#00a8ff", "jackbox": "#9c88ff"}


def centered_text(draw, x, y, text, font):
    w, h = font.getsize(text)
    draw.text((x - (w / 2), y), text, font=font)


def wrapped_text(draw, x, y, text, font, maxwidth=box_width):
    # Split the text into multiple lines
    text = text.split(" ")
    i = 0
    lines = []
    line = ""
    for word in text:
        w, h = font.getsize(line + word)
        if w >= maxwidth:
            lines.append(line)
            line = ""
        line += word + " "
    lines.append(line)

    # Build the text from the bottom upwards
    yy = y
    for line in lines[::-1]:
        w, h = font.getsize(line + word)
        draw.text((x, yy), line, font=font)
        yy -= h + 4


def create_canvas():
    total_width = (box_width * 7) + (padding * 6) + (margin * 2)
    total_height = (box_height * 5) + (padding * 4) + (margin * 2)

    canvas = Image.new("RGBA", (total_width, total_height), "#dcdde1")
    draw = ImageDraw.Draw(canvas)

    for idx, day in enumerate(day_names):
        xx = margin + (box_width * (idx)) + (padding * (idx - 1))
        yy = margin / 2
        centered_text(draw, xx + (box_width / 2), yy, day, font_medium)

    return canvas


def render_blank_day(number):
    box = Image.new("RGBA", (box_width, box_height), "#bdc3c7")
    draw = ImageDraw.Draw(box)
    draw.text((6, 2), str(number), font=font_bold)
    return box


def render_event_image(box, image):
    size = math.floor(box_height / 2)
    img = Image.open(image).resize((size, size)).convert("RGBA")
    box.paste(img, (box_width - size - 4, 4), img)
    return box


def render_event_day(event):
    color = background_colors[event["category"]]
    image = "./img/event/" + event["category"] + ".png"

    box = Image.new("RGBA", (box_width, box_height), color)
    draw = ImageDraw.Draw(box)
    draw.text((6, 2), str(event["date"].day), font=font_bold)
    wrapped_text(draw, 6, 112, event["title"], font_light, box_width - 16)

    box = render_event_image(box, image)
    return box


def box_position(position):
    xx = position % 7
    yy = math.floor(position / 7)

    return (
        margin + (box_width * xx) + (padding * (xx - 1)),
        margin + (box_height * yy) + (padding * (yy - 1)),
    )


def iterate_month(year, month, events):
    canvas = create_canvas()

    start_day, month_length = calendar.monthrange(year, month)
    for i in range(month_length):
        day_number = i + 1

        if day_number in events:
            box = render_event_day(events[day_number][0])
        else:
            box = render_blank_day(day_number)

        p = box_position(start_day + i)
        canvas.paste(box, p)

    canvas.save("./img/calendar.png")


if __name__ == "__main__":
    # Split the event args
    args = sys.argv[1:]
    events = {}

    # Get the current date
    tz = datetime.timezone(datetime.timedelta(hours=10))
    today = datetime.datetime.now(tz)

    f = open("out.txt", "w")
    sys.stdout = f

    for arg in args:
        arg = arg.split(".")
        print(arg)

        date = datetime.datetime.strptime(arg[0], "%a, %d %b %Y %H:%M:%S %Z")
        date = date.replace(tzinfo=datetime.timezone.utc)
        date = date.astimezone()
        print(date)

        # Skip anything that isn't this month
        if date.year != today.year or date.month != today.month:
            continue

        event = {"date": date, "category": arg[1], "title": arg[2]}

        # Group events by day
        if date.day in events:
            events[date.day].append(event)
        else:
            events[date.day] = [event]

    iterate_month(today.year, today.month, events)
