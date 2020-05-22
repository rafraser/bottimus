from PIL import Image, ImageDraw, ImageFont
import datetime
import calendar
import math
import sys
import argparse

# Load fonts from file
font_bold = ImageFont.truetype("./img/font/Montserrat-Black.ttf", 48)
font_medium = ImageFont.truetype("./img/font/Montserrat-Black.ttf", 32)
font_light = ImageFont.truetype("./img/font/Montserrat-Regular.ttf", 24)
font_header = ImageFont.truetype("./img/font/lemonmilk-light.ttf", 128)

# Sizing properties
box_width = 250
box_height = 150
padding = 12
margin = 128
top_size = 112

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

# Colors
COLOR_PINK = "#f368e0"
COLOR_GREEN = "#4cd137"
COLOR_YELLOW = "#e1b12c"
COLOR_PURPLE = "#9c88ff"
COLOR_BLUE = "#00a8ff"
COLOR_RED = "#e84118"

# Background colours for the events
background_colors = {
    "art": COLOR_PINK,
    "csgo": COLOR_YELLOW,
    "death": COLOR_PURPLE,
    "deathrun": COLOR_RED,
    "dodgeball": COLOR_BLUE,
    "dota": COLOR_RED,
    "generic": COLOR_BLUE,
    "gmod": COLOR_BLUE,
    "golf": COLOR_GREEN,
    "hidden": COLOR_RED,
    "jackbox": COLOR_PURPLE,
    "league": COLOR_PURPLE,
    "mapping": COLOR_GREEN,
    "minecraft": COLOR_GREEN,
    "minigames": COLOR_YELLOW,
    "movie": COLOR_PINK,
    "murder": COLOR_RED,
    "music": COLOR_PINK,
    "overwatch": COLOR_YELLOW,
    "racing": COLOR_GREEN,
    "sandbox": COLOR_GREEN,
    "stream": COLOR_PINK,
    "switch": COLOR_RED,
    "testing": COLOR_GREEN,
    "voice": COLOR_BLUE,
    "zombie": COLOR_RED,
}


def centered_text(draw, x, y, text, font, fill=(255, 255, 255, 255)):
    """Draw centered text

    Arguments:
        draw {[type]} -- [description]
        x {[type]} -- [description]
        y {[type]} -- [description]
        text {[type]} -- [description]
        font {[type]} -- [description]

    Keyword Arguments:
        fill {tuple} -- [description] (default: {(255, 255, 255, 255)})
    """
    w, h = font.getsize(text)
    draw.text((x - (w / 2), y), text, font=font, fill=fill)


def right_aligned_text(draw, x, y, text, font, fill=(255, 255, 255, 255)):
    """Draw right-aligned text

    Arguments:
        draw {[type]} -- [description]
        x {[type]} -- [description]
        y {[type]} -- [description]
        text {[type]} -- [description]
        font {[type]} -- [description]

    Keyword Arguments:
        fill {tuple} -- [description] (default: {(255, 255, 255, 255)})
    """
    w, h = font.getsize(text)
    draw.text((x - w, y), text, font=font, fill=fill)


def wrapped_text(draw, x, y, text, font, maxwidth=box_width):
    """Draw wrapped text within a box

    Arguments:
        draw {[type]} -- [description]
        x {[type]} -- [description]
        y {[type]} -- [description]
        text {[type]} -- [description]
        font {[type]} -- [description]

    Keyword Arguments:
        maxwidth {[type]} -- [description] (default: {box_width})
    """
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


def create_canvas(year, month):
    """Create the base calendar canvas
    This adjusts sizing based on what month of the year it is

    Arguments:
        year {[type]} -- Calendar year
        month {[type]} -- Calendar month

    Returns:
        [type] -- Generated canvas image
    """
    num_weeks = len(calendar.monthcalendar(year, month))

    total_width = (box_width * 7) + (padding * 6) + (margin * 2)
    total_height = top_size + (box_height * num_weeks) + (padding * 4) + (margin * 2)

    canvas = Image.new("RGBA", (total_width, total_height), "#dcdde1")
    draw = ImageDraw.Draw(canvas)

    month_name = calendar.month_name[month]
    right_aligned_text(
        draw, total_width - margin, 6, month_name, font_header, (87, 101, 116)
    )

    for idx, day in enumerate(day_names):
        xx = margin + (box_width * (idx)) + (padding * (idx - 1))
        yy = top_size + margin / 2
        centered_text(draw, xx + (box_width / 2), yy, day, font_medium, (87, 101, 116))

    return canvas


def render_blank_day(number):
    """Render a blank calendar square
    This is a simple box with the date attached

    Arguments:
        number {[type]} -- Date number

    Returns:
        [type] -- Generated calendar square
    """
    box = Image.new("RGBA", (box_width, box_height), "#bdc3c7")
    draw = ImageDraw.Draw(box)
    draw.text((6, 2), str(number), font=font_bold)
    return box


def render_event_image(box, image):
    """Paste an event image into the relevant box

    Arguments:
        box {[type]} -- Existing calendar square to add image to
        image {[type]} -- Image file for event icon

    Returns:
        [type] -- New calendar square with event icon
    """
    size = math.floor(box_height / 2)
    img = Image.open(image).resize((size, size)).convert("RGBA")
    box.paste(img, (box_width - size - 4, 4), img)
    return box


def render_event_day(event):
    """Render a calendar square with a single scheduled event
    This box is coloured based on the event type
    This box also has an icon based on the event type

    Arguments:
        event {[type]} -- Event data

    Returns:
        [type] -- Generated calendar square
    """
    color = background_colors[event["category"]]
    image = "./img/event/" + event["category"] + ".png"

    box = Image.new("RGBA", (box_width, box_height), color)
    draw = ImageDraw.Draw(box)
    draw.text((6, 2), str(event["date"].day), font=font_bold)
    wrapped_text(draw, 6, 112, event["title"], font_light, box_width - 16)

    box = render_event_image(box, image)
    return box


def box_position(position):
    """Calculate the positioning of a calendar box

    Arguments:
        position {[type]} -- Day number of the month

    Returns:
        [type] -- (x, y) tuple for the calendar square positioning
    """
    xx = position % 7
    yy = math.floor(position / 7)

    return (
        margin + (box_width * xx) + (padding * (xx - 1)),
        top_size + margin + (box_height * yy) + (padding * (yy - 1)),
    )


def iterate_month(year, month, events):
    """Iterate over a month, creating calendar squares as needed

    Arguments:
        year {[type]} -- Calendar year
        month {[type]} -- Calendar month
        events {[type]} -- List of events for data
    """
    canvas = create_canvas(year, month)

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


def process_events_list(events):
    """Process a list of event strings into proper event structures

    Arguments:
        events {[type]} -- [description]

    Returns:
        [type] -- List of processed event structures
    """
    return events


def main(args):
    # Get the current date
    tz = datetime.timezone(datetime.timedelta(hours=10))
    today = datetime.datetime.now(tz)
    events = {}

    for e in args.events:
        # Split up the argument and parse the time
        e = e.split("|")
        date = datetime.datetime.strptime(e[0], "%a, %d %b %Y %H:%M:%S %Z")
        date = date.replace(tzinfo=datetime.timezone.utc)
        date = date.astimezone()

        # Skip anything that isn't this month
        if date.year != today.year or date.month != today.month:
            continue

        event = {"date": date, "category": e[1], "title": e[2]}

        # Group events by day
        if date.day in events:
            events[date.day].append(event)
        else:
            events[date.day] = [event]

    # Generate the calendar for the month using the events list
    iterate_month(today.year, today.month, events)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a calendar for a list of events"
    )
    parser.add_argument("--events", nargs="+", help="List of events")
    args = parser.parse_args()
    main(args)
