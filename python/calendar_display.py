from PIL import Image, ImageDraw, ImageFont
import datetime
import calendar
import math
import sys
import argparse
from event_categories import COLORS, categories

# Load fonts from file
font_bold = ImageFont.truetype("./img/font/Montserrat-Black.ttf", 48)
font_medium = ImageFont.truetype("./img/font/Montserrat-Black.ttf", 32)
font_light = ImageFont.truetype("./img/font/Montserrat-Regular.ttf", 24)
font_light_small = ImageFont.truetype("./img/font/Montserrat-Regular.ttf", 20)
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
COLOR_DARK = "#576574"
COLOR_BACKGROUND = "#dcdde1"
COLOR_BLANK = "#bdc3c7"


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
        w, h = font.getsize(line)
        draw.text((x, yy), line, font=font)
        yy -= h + 4


def single_line_text(draw, x, y, text, font, maxwidth=box_width, maxheight=box_height):
    """Draw a single line of text, centered in a box

    Arguments:
        draw {[type]} -- [description]
        x {[type]} -- [description]
        y {[type]} -- [description]
        text {[type]} -- [description]
        font {[type]} -- [description]

    Keyword Arguments:
        maxwidth {[type]} -- [description] (default: {box_width})
        maxheight {[type]} -- [description] (default: {box_height})
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

    # In this situation we take and draw only the last line
    line = lines[-1]
    w, h = font.getsize(line)

    yy = math.floor((maxheight / 2) - (h / 2)) - 1
    draw.text((x, y + yy), line, font=font)


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

    canvas = Image.new("RGBA", (total_width, total_height), COLOR_BACKGROUND)
    draw = ImageDraw.Draw(canvas)

    month_name = calendar.month_name[month] + " " + str(year)
    right_aligned_text(
        draw, total_width - margin, 6, month_name, font_header, COLOR_DARK
    )

    for idx, day in enumerate(day_names):
        xx = margin + (box_width * (idx)) + (padding * (idx - 1))
        yy = top_size + margin / 2
        centered_text(draw, xx + (box_width / 2), yy, day, font_medium, COLOR_DARK)

    return canvas


def render_blank_day(number):
    """Render a blank calendar square
    This is a simple box with the date attached

    Arguments:
        number {[type]} -- Date number

    Returns:
        [type] -- Generated calendar square
    """
    box = Image.new("RGBA", (box_width, box_height), COLOR_BLANK)
    draw = ImageDraw.Draw(box)
    draw.text((6, 2), str(number), font=font_bold)
    return box


def render_event_image(box, image, size=(math.floor(box_height / 2)), offset=(4, 4)):
    """Paste an event image into the relevant box

    Arguments:
        box {[type]} -- Existing calendar square to add image to
        image {[type]} -- Image file for event icon

    Returns:
        [type] -- New calendar square with event icon
    """
    img = Image.open(image).resize((size, size)).convert("RGBA")
    box.paste(img, (box_width - size - offset[0], offset[1]), img)
    return box


def render_event_day(day, events):
    """Render a calendar square with a single scheduled event
    This box is coloured based on the event type
    This box also has an icon based on the event type

    Arguments:
        day   {[type]} -- Day of the month to generate the box
        event {[type]} -- List of events falling on this day

    Returns:
        [type] -- Generated calendar square
    """
    # Only take up to 5 events
    events = sorted(events, key=lambda e: e["date"])
    events = events[:5]
    n = len(events)

    # Create the box
    box = Image.new("RGBA", (box_width, box_height))
    draw = ImageDraw.Draw(box)
    row_height = box_height / n
    icon_size = math.floor(box_height / n) - 8 if n > 1 else math.floor(box_height / 2)

    # Add a row in the box for each scheduled event
    for i in range(n):
        event = events[i]
        color_name = categories().get(event["category"])
        color = COLORS.get(color_name)[0]
        image = "./img/event/" + event["category"] + ".png"

        # Fill in the box background for each event
        top = math.floor(i * row_height)
        bottom = math.ceil((i + 1) * row_height)
        draw.rectangle((0, top, box_width, bottom), fill=color)

        # Add in event text
        if n < 2:
            wrapped_text(draw, 6, 112, event["title"], font_light, box_width - 16)
        else:
            single_line_text(
                draw,
                6,
                top,
                event["title"],
                font_light_small,
                maxwidth=box_width - 16,
                maxheight=row_height,
            )

        # Draw the event icon
        box = render_event_image(box, image, size=icon_size, offset=(4, top + 4))

        # Add a divider between lines as needed
        if i > 0:
            draw.line((0, top, box_width, top), fill=COLOR_BLANK)

    # Stamp the number if there's only one event
    if n == 1:
        draw.text((6, 2), str(day), font=font_bold)
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
            box = render_event_day(day_number, events[day_number])
        else:
            box = render_blank_day(day_number)

        p = box_position(start_day + i)
        canvas.paste(box, p)

    canvas.save("./img/calendar.png")


def process_events_list(today, args):
    """Process a list of event strings into proper event structures

    Arguments:
        events {[type]} -- [description]

    Returns:
        [type] -- List of processed event structures
    """
    events = {}

    for e in args:
        # Split up the argument and parse the time
        e = e.split("|")
        date = datetime.datetime.fromisoformat(e[0])
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

    return events


def main(args):
    # Get the current date
    tz = datetime.timezone(datetime.timedelta(hours=10))
    today = datetime.datetime.now(tz)
    events = process_events_list(today, args.events)

    # Generate the calendar for the month using the events list
    iterate_month(today.year, today.month, events)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a calendar for a list of events"
    )
    parser.add_argument("--events", nargs="+", help="List of events")
    args = parser.parse_args()
    main(args)
