from PIL import Image, ImageDraw, ImageFont

# Define the lesson data
# lessons = [ # SAMPLE DATA
#     (0, 0, 'Music', 'C2', 'VF', 'yellow'),
#     (1, 1, 'Comp', 'MUS', 'VF', 'orangered'),
#     (2, 2, 'Music', 'MUS', 'GF', 'skyblue'),
#     (3, 3, 'Comp', 'MUS', 'VF', 'yellow'),
#     (4, 4, 'Music', 'C2', 'VF', 'orangered'),
#     (4, 5, 'Music', 'MUS', 'GF', 'skyblue'),
#     (5, 6, 'Comp', 'MUS', 'VF', 'yellow'),
#     (5, 7, 'Comp', 'C2', 'VF', 'orangered'),
#     (6, 8, 'Music', 'MUS', 'GF', 'skyblue'),
#     (7, 9, 'Music', 'MUS', 'VF', 'yellow'),
#     (8, 6, 'Comp', 'MUS', 'GF', 'grey'),
#     (9, 5, 'Music', 'C2', 'VF', 'yellow'),
# ]

# LOAD DATA FROM timetables/19wilde.json
import json

# list files in timetables directory

import os
to_export = []
for file in os.listdir("timetables"):
    if file.endswith(".json"):
        to_export.append(file.replace(".json", ""))

for name in to_export:
    with open(f"timetables/{name}.json") as f:
        data = json.load(f)

    lessons_in = data["times"]
    lessons_dict = data["dict"]

    lessons = []

    # in format
    # {
        # "times": {
        #     "1": {
        #         "4": [0, "6F"],
        #         "6": [1, "C2"],
        #         "8": [2, "Mus"]
        #     }
    # }
    # where times["1"] means Mon1, times["4"] means Thu1, etc.
    # and times["4"]["2"] means Thu1 AM, times["4"]["9"] means Thu1 Lunch, etc.
    for day, times in lessons_in.items():
        for time, lesson in times.items():
            subject = lessons_dict[str(lesson[0])]["subject"]
            room = lesson[1]
            teacher = lessons_dict[str(lesson[0])]["teacher"]
            color = lessons_dict[str(lesson[0])]["color"]
            lessons.append((int(day)-1, int(time)-2, subject, room, teacher, color))

    print(lessons)
    print()
    print(lessons[0])






    # Define the grid dimensions
    days = ["Mon1", "Tue1", "Wed1", "Thu1", "Fri1", "Mon2", "Tue2", "Wed2", "Thu2", "Fri2"]
    periods = ["AM", "P1", "P2", "Break", "P3", "PM", "Lunch", "P4", "P5", "After"]
    height_periods = [True, False, False, True, False, True, True, False, False, False]
    cell_width_full = 55
    cell_width_half = 45
    cell_height_full = 30
    cell_height_half = 15
    margin = 4
    text_margin = 4

    # Create the image
    image_width = margin * 2 + cell_width_half + cell_width_full * 10
    image_height = cell_height_half + cell_height_full * 6 + cell_height_half * 4 + margin * 2
    image = Image.new('RGB', (image_width, image_height), 'white')
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()



    heights_from_top = [
        margin + cell_height_half * 0 + cell_height_full * 0,
        margin + cell_height_half * 1 + cell_height_full * 0,
        margin + cell_height_half * 2 + cell_height_full * 0,
        margin + cell_height_half * 2 + cell_height_full * 1,
        margin + cell_height_half * 2 + cell_height_full * 2,
        margin + cell_height_half * 3 + cell_height_full * 2,
        margin + cell_height_half * 3 + cell_height_full * 3,
        margin + cell_height_half * 4 + cell_height_full * 3,
        margin + cell_height_half * 5 + cell_height_full * 3,
        margin + cell_height_half * 5 + cell_height_full * 4,
        margin + cell_height_half * 5 + cell_height_full * 5,
        margin + cell_height_half * 5 + cell_height_full * 6
    ]

    widths_from_left = [
        margin,
        margin + cell_width_half,
        margin + cell_width_half + cell_width_full * 1,
        margin + cell_width_half + cell_width_full * 2,
        margin + cell_width_half + cell_width_full * 3,
        margin + cell_width_half + cell_width_full * 4,
        margin + cell_width_half + cell_width_full * 5,
        margin + cell_width_half + cell_width_full * 6,
        margin + cell_width_half + cell_width_full * 7,
        margin + cell_width_half + cell_width_full * 8,
        margin + cell_width_half + cell_width_full * 9,
        margin + cell_width_half + cell_width_full * 10
    ]

    # headers top
    for i in range(1, len(widths_from_left)-1):
        draw.rectangle([widths_from_left[i], heights_from_top[0], widths_from_left[i+1], heights_from_top[1]], fill="grey")
        # text in centre of box
        text = days[i-1]
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        draw.text((widths_from_left[i] + (cell_width_full - text_width) / 2, heights_from_top[0] + (cell_height_half - text_height) / 2), text, fill="black", font=font)

    # headers left
    for i in range(1, len(heights_from_top)-1):
        draw.rectangle([widths_from_left[0], heights_from_top[i], widths_from_left[1], heights_from_top[i+1]], fill="grey")
        # text in centre of box
        # take into account whether it's a half height box or not (height_periods)
        # if height_periods[i-1]: then it's a half height box so use cell_height_half instead of cell_height_full
        text = periods[i-1]
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        if height_periods[i-1]:
            draw.text((widths_from_left[0] + (cell_width_half - text_width) / 2, heights_from_top[i] + (cell_height_half - text_height) / 2), text, fill="black", font=font)
        else:
            draw.text((widths_from_left[0] + (cell_width_half - text_width) / 2, heights_from_top[i] + (cell_height_full - text_height) / 2), text, fill="black", font=font)


    for lesson in lessons:
        # draw the lesson box
        day_idx, time_idx, subject, room, teacher, color = lesson
        is_full_height = not height_periods[time_idx]

        # calculate the box dimensions
        if is_full_height or time_idx == 6:
            box_height = cell_height_full
        else:
            box_height = cell_height_half
        box_width = cell_width_full

        # get box position
        if not time_idx == 6:
            box_top = heights_from_top[time_idx+1]
            box_left = widths_from_left[day_idx+1]
        else:
            box_top = heights_from_top[6]
            box_left = widths_from_left[day_idx+1]

        # draw the background
        draw.rectangle([box_left, box_top, box_left + box_width, box_top + box_height], fill=color)

        # text yayyyy
        if is_full_height or time_idx == 6:
            text_to_write1 = f"{subject}"
            text_to_write2 = f"{room} {teacher}"

            # calculate text width and height
            text_bbox1 = draw.textbbox((0, 0), text_to_write1, font=font)
            text_width1 = text_bbox1[2] - text_bbox1[0]
            text_height1 = text_bbox1[3] - text_bbox1[1]

            text_bbox2 = draw.textbbox((0, 0), text_to_write2, font=font)
            text_width2 = text_bbox2[2] - text_bbox2[0]
            text_height2 = text_bbox2[3] - text_bbox2[1]

            # calculate boxes
            new_box_height = box_height/2
            new_box_width = box_width

            box_left1 = box_left
            box_top1 = box_top

            box_left2 = box_left
            box_top2 = box_top + new_box_height

            # calculate positions
            text_left1 = box_left1 + (new_box_width - text_width1) / 2
            text_top1 = box_top1 + (new_box_height - text_height1) / 2

            text_left2 = box_left2 + (new_box_width - text_width2) / 2
            text_top2 = box_top2 + (new_box_height - text_height2) / 2

            # draw text
            draw.text((text_left1, text_top1), text_to_write1, fill="black", font=font)
            draw.text((text_left2, text_top2), text_to_write2, fill="black", font=font)

        else:
            text_to_write = f"{room} {teacher}"

            # calculate text width and height
            text_bbox = draw.textbbox((0, 0), text_to_write, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]

            # calculate positions
            text_left = box_left + (box_width - text_width) / 2
            text_top = box_top + (box_height - text_height) / 2

            # draw text
            draw.text((text_left, text_top), text_to_write, fill="black", font=font)
        
        # 



    # draw outer box

    # draw horizontal lines
    for index, height in enumerate(heights_from_top):
        if not index == 7:
            draw.line([margin, height, image_width-margin, height], fill="black")

    # draw horizontal for 7 for each day only if there isn't a lesson in period 6
    # far left column (headers) is always drawn
    draw.line([widths_from_left[0], heights_from_top[7], widths_from_left[0+1], heights_from_top[7]], fill="black")
    for i in range(1, len(widths_from_left)-1):
        lesson_at6=False
        for lesson in lessons:
            if lesson[1] == 6 and lesson[0] == i-1:
                lesson_at6 = True
        if not lesson_at6:
            draw.line([widths_from_left[i], heights_from_top[7], widths_from_left[i+1], heights_from_top[7]], fill="black")

    # draw vertical lines
    for width in widths_from_left:
        draw.line([width, margin, width, image_height-margin], fill="black")

    # write name in top left box
    text = data["name"]
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    draw.text((widths_from_left[0] + (cell_width_half - text_width) / 2, heights_from_top[0] + (cell_height_half - text_height) / 2), text, fill="black", font=font)

    # Save the image
    image.save(f"output/{name}_timetable.png")