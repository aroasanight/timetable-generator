import fitz
import re
import json
import os
import time
import pytesseract
from PIL import Image, ImageDraw, ImageFont, ImageColor


valid_colours = []
for name, code in ImageColor.colormap.items():
    valid_colours.append(name)



def load_from_pdf(path):
    # position data
    widthdiv = 1122.52
    heightdiv = 793.701

    headerx = 54
    headery = 54
    headerendx = 1068
    headerendy = 72


    y_labels = [
        "MonA",
        "TueA",
        "WedA",
        "ThuA",
        "FriA",
        "MonB",
        "TueB",
        "WedB",
        "ThuB",
        "FriB"
    ]

    x_labels = [
        "AM",
        "P1",
        "P2",
        "Break",
        "P3",
        "PM",
        "Lunch",
        "P4",
        "P5"
    ]

    days = []

    pdf_document = fitz.open(path)

    # calculate positions based on size of first page
    width = pdf_document[0].rect[2]
    height = pdf_document[0].rect[3]

    size_mod_width = width / widthdiv
    size_mod_height = height / heightdiv

    headerx2 = headerx * size_mod_width
    headery2 = headery * size_mod_height
    headerendx2 = headerendx * size_mod_width
    headerendy2 = headerendy * size_mod_height

    # detect whether days are horizontal or vertical
    # check for text between (136, 90) and (340, 118)
    text = pdf_document[0].get_text("text", clip=(136*size_mod_width, 90*size_mod_height, 340*size_mod_width, 118*size_mod_height))

    if "Monday" in text:
        mode = "days"
    elif "Tutor" in text:
        mode = "periods"
    else:
        print("Error: Could not detect timetable format.")
        return None


    print(text)

    if mode == "periods":
        y = [
            # 90.026,
            120.026,
            234.026,
            348.026,
            462.026,
            576.026,
            690.026,
        ]

        x = [
            # 56.691,
            136.693,
            239.137,
            341.582,
            444.026,
            546.471,
            648.915,
            751.36,
            853.804,
            956.249,
            1058.693
        ]
    else:
        y = [
            120.026,
            159.337,
            237.957,
            316.578,
            355.888,
            434.509,
            473.819,
            532.785,
            611.406,
            690.826
        ]

        x = [
            136.693,
            321.092,
            505.493,
            689.893,
            874.293,
            1059.693
        ]

    for i in range(len(y)):
        y[i] *= size_mod_height

    for i in range(len(x)):
        x[i] *= size_mod_width

    
    # get name and tutor
    header = pdf_document[0].get_text("text", clip=(headerx2, headery2, headerendx2, headerendy2)).split(",")

    name = header[0].replace("Timetable for ", "").strip()
    short_name = name.split(" ")[0][:6]
    tutor_group = header[1].strip()

    print(f"Hi, {name}! We're loading your timetable from a PDF.")
    print(f"We detected your tutor group is {tutor_group}.")
    print(f"We'll use the name {short_name} on your timetable due to size constraints.")

    # detect whether days are in rows or columns


    # load events 
    for page_num in range(len(pdf_document)):
        page = pdf_document[page_num]

        for yindex, row in enumerate(y[:-1]):
            days.append([])
            for xindex, col in enumerate(x[:-1]):
                # check if there is text between (col, row) and (x2[xindex+1], y2[yindex+1])
                text = page.get_text("text", clip=(col, row, x[xindex+1], y[yindex+1]))
                days[-1].append(text.replace("\n"," ").strip())
        
    pdf_document.close()

    # remove overflow invisible text
    for day in days:
        if "(08:55-09:10) " in day[0]:
            day[0] = day[0].replace("(08:55-09:10) ", "")
        if "(12:30-12:45) " in day[5]:
            day[5] = day[5].replace("(12:30-12:45) ", "")

    events = []


    # deduce subject, room and staff code from event name
    def process_event(event):
        # Split and clean the last two words
        s1 = event[2].split(" ")[-1].upper().replace(" ", "")
        try:
            s2 = event[2].split(" ")[-2].upper().replace(" ", "")
        except:
            s2 = "NUL"
        
        room = None
        staff = None

        staff_regex = r'^[A-Z]{0,3}$'
        room_regex = r'^([A-Z]{1,3}\d{1,2}|6F|LIBRARY|MUS)$'
        
        # Check if s1 is a staff code (1-3 lowercase letters)
        if re.match(staff_regex, s1):
            staff = s1
        
        # Check if s2 is a room code (1-3 letters + 1-2 numbers, or special cases '6f' or 'library')
        if re.match(room_regex, s2):
            room = s2
        # If s2 isn't a room code, check if s1 is
        elif re.match(room_regex, s1):
            room = s1
        
        if room == "LIBRARY":
            room = "LIB"
            
        return room, staff

    translate = [
        ["Comp", "mediumslateblue", ["computing"]],
        ["Maths", "skyblue", ["maths"]],
        ["Music", "mediumseagreen", ["music"]],
        ["Study", "orangered", ["6th form study"]],
        ["Tutor", "lightgrey", [": gb", ": pp", ": vf", ": de", ": bw", ": nr", "10: a4", "10: w4", "10: f4", "10: g4", "10: n4", "11: a5", "11: w5", "11: f5", "11: g5", "11: n5", " a1", " a2", " a3", " w1", " w2", " w3", " g1", " g2", " g3", " f1", " f2", " f3", " n1", " n2", " n3"]],
        ["CR", "lightcoral", ["citizenship"]],
        ["PE", "royalblue", ["pe"]],
        ["Sci", "limegreen", ["science"]],
        ["Phys", "limegreen", ["physics"]],
        ["Chem", "limegreen", ["chemistry"]],
        ["Bio", "limegreen", ["biology"]],
        ["Eng", "tomato", ["english"]],
        ["Hist", "gold", ["history"]],
        ["Geog", "mediumaquamarine", ["geography"]],
        ["RE", "hotpink", ["religious"]],
        ["Fr", "lightcoral", ["french"]],
        ["Sp", "lightcoral", ["spanish"]],
        ["Drama", "pink", ["drama"]],
        ["Dance", "palevioletred", ["dance"]],
        ["Art", "crimson", ["art"]],
        ["Media", "hotpink", ["media"]]
    ]

    for day_number, day in enumerate(days):
        for period_number, period in enumerate(day):
            if not period == "":
                event = [day_number, period_number, period]
                room, staff = process_event(event)

                if not (period_number == 0 and room == None):
                    subject = ""

                    colour = None

                    for translation in translate:
                        for word in translation[2]:
                            if word in period.lower():
                                subject = translation[0]
                                colour = translation[1]
                                break
                    
                    if colour == None:
                        colour = "grey"
                        subject = "Unknown"
                    
                    if room == None:
                        room = ""
                    
                    if staff == None:
                        staff = ""

                    events.append([day_number, period_number, subject, room, staff, colour])

                    # print(events[-1])

    # lunch lessons
    new_events = []

    events = events[::-1]

    for index, event in enumerate(events):
        if event[1] == 6 and events[index+1] == [event[0], 5, event[2], event[3], event[4], event[5]]:
            new_events.append(event)
        elif event[1] == 5 and [event[0], 6, event[2], event[3], event[4], event[5]] in new_events:
            pass
        elif event[1] >= 6:
            new_events.append([event[0], event[1]+1, event[2], event[3], event[4], event[5]])
        else:
            new_events.append(event)

    events = new_events[::-1]

    return name, short_name, tutor_group, events
        

def save_json(name, short_name, tutor_group, events, path):
    with open(path, "w") as f:
        json.dump({"name": name, "short": short_name, "tutor": tutor_group, "events": events}, f, indent=4)

    print(f"Generated and saved a JSON format timetable for {name} to {path}.")


def check_json_format(json_in, filename):
    if not "name" in json_in:
        print(f"Error: JSON file {filename} does not contain a 'name' key.")
        return False
    if not "short" in json_in:
        print(f"Error: JSON file {filename} does not contain a 'short' key.")
        return False
    if not "tutor" in json_in:
        print(f"Error: JSON file {filename} does not contain a 'tutor' key.")
        return False
    if not "events" in json_in:
        print(f"Error: JSON file {filename} does not contain an 'events' key.")
        return False
    if not isinstance(json_in["name"], str):
        print(f"Error: 'name' key in JSON file {filename} is not a string.")
        return False
    if not isinstance(json_in["short"], str):
        print(f"Error: 'short' key in JSON file {filename} is not a string.")
        return False
    if not isinstance(json_in["tutor"], str):
        print(f"Error: 'tutor' key in JSON file {filename} is not a string.")
        return False
    if not isinstance(json_in["events"], list):
        print(f"Error: 'events' key in JSON file {filename} is not a list.")
        return False
    for event in json_in["events"]:
        if not isinstance(event, list):
            print(f"Error: in JSON {filename} an event in the 'events' list is not a list.")
            return False
        if not len(event) == 6:
            print(f"Error: in JSON {filename} an event in the 'events' list does not have 6 elements.")
            return False
        if not isinstance(event[0], int):
            print(f"Error: in JSON {filename} the day of an event in the 'events' list is not an integer.")
            return False
        if not isinstance(event[1], int):
            print(f"Error: in JSON {filename} the period of an event in the 'events' list is not an integer.")
            return False
        if not isinstance(event[2], str):
            print(f"Error: in JSON {filename} the subject of an event in the 'events' list is not a string.")
            return False
        if not isinstance(event[3], str):
            print(f"Error: in JSON {filename} the room of an event in the 'events' list is not a string.")
            return False
        if not isinstance(event[4], str):
            print(f"Error: in JSON {filename} the staff code of an event in the 'events' list is not a string.")
            return False
        if not isinstance(event[5], str):
            print(f"Error: in JSON {filename} the colour of an event in the 'events' list is not a string.")
            return False
        if not event[5] in valid_colours:
            print(f"Error: in JSON {filename} the colour of an event in the 'events' list is not a valid colour.")
            return False
    return True


def generate_timetable_image(mode, json_in, path):
    if not check_json_format(json_in, "unknown"):
        return
    
    name = json_in["name"]
    short_name = json_in["short"]
    tutor_group = json_in["tutor"]
    events = json_in["events"]

    header_row_height = 13
    header_col_width = 45

    col_width = 50
    full_row_height = 26
    half_row_height = 13

    margin = 4

    day_names = ["Mon1", "Tue1", "Wed1", "Thu1", "Fri1", "Mon2", "Tue2", "Wed2", "Thu2", "Fri2"]
    period_names = ["AM", "P1", "P2", "Break", "P3", "PM", "Lunch", "P4", "P5", "After"]

    if mode == "w1":
        days = [True, True, True, True, True, False, False, False, False, False]
        periods = [True, True, True, True, True, True, True, True, True, False]
        full_height = [False, True, True, False, True, False, False, True, True, True]
    elif mode == "w2":
        days = [False, False, False, False, False, True, True, True, True, True]
        periods = [True, True, True, True, True, True, True, True, True, False]
        full_height = [False, True, True, False, True, False, False, True, True, True]
    elif mode == "full":
        days = [True, True, True, True, True, True, True, True, True, True]
        periods = [True, True, True, True, True, True, True, True, True, True]
        full_height = [True, True, True, True, True, True, True, True, True, True]
    elif mode == "no-break":
        days = [True, True, True, True, True, True, True, True, True, True]
        periods = [True, True, True, False, True, True, True, True, True, True]
        full_height = [False, True, True, False, True, False, False, True, True, True]
    elif mode == "no-break-after":
        days = [True, True, True, True, True, True, True, True, True, True]
        periods = [True, True, True, False, True, True, True, True, True, False]
        full_height = [False, True, True, False, True, False, False, True, True, True]
    else:
        days = [True, True, True, True, True, True, True, True, True, True]
        periods = [True, True, True, True, True, True, True, True, True, True]
        full_height = [False, True, True, False, True, False, False, True, True, True]


    valid_periods = [periods[0], periods[1], periods[2], periods[3], periods[4], periods[5], periods[5] or periods[6], periods[6], periods[7], periods[8], periods[9]]

    tutorlunch_relative = 0
    for period in range(6):
        if periods[period]:
            tutorlunch_relative += 1

    day_names_filtered = []
    for i in range(len(days)):
        if days[i]:
            day_names_filtered.append(day_names[i])
    
    period_names_filtered = []
    for i in range(len(periods)):
        if periods[i]:
            period_names_filtered.append(period_names[i])

    num_days = 0
    num_periods = 0
    num_full_height = 0
    num_half_height = 0

    full_height_by_periods = []
    for i in range(len(periods)):
        if periods[i]:
            full_height_by_periods.append(full_height[i])

    for day in days:
        if day:
            num_days += 1
    
    for period in periods:
        if period:
            num_periods += 1
    
    for index, height in enumerate(full_height):
        if periods[index]:
            if height:
                num_full_height += 1
            else:
                num_half_height += 1
    
    table_width = header_col_width + col_width * num_days
    table_height = header_row_height + full_row_height * num_full_height + half_row_height * num_half_height
    
    full_image_width = margin * 2 + table_width
    full_image_height = margin * 2 + table_height


    image = Image.new('RGB', (full_image_width, full_image_height), 'white')
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()

    draw_events = []

    for event in events:
        if days[event[0]] and valid_periods[event[1]]:
            day = event[0]
            period = event[1]

            for i in range(day):
                if not days[i]:
                    day -= 1
            
            for i in range(period):
                if not valid_periods[i]:
                    period -= 1
            
            draw_events.append([day, period, event[2], event[3], event[4], event[5]])
    
    period_positions = []
    acc = margin + header_row_height
    for i in range(len(periods)):
        if periods[i]:
            period_positions.append(acc)
            if full_height[i]:
                acc += full_row_height
            else:
                acc += half_row_height

    day_positions = []
    acc = margin + header_col_width
    for i in range(len(days)):
        if days[i]:
            day_positions.append(acc)
            acc += col_width

    # draw headers (top)
    for i in range(num_days):
        draw.rectangle([day_positions[i], margin, day_positions[i] + col_width, margin + header_row_height], fill="grey")
        text = day_names_filtered[i]
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        draw.text((day_positions[i] + (col_width - text_width) / 2, margin + (header_row_height - text_height) / 2), text, fill="black", font=font)
    
    # draw headers (left)
    for i in range(num_periods):
        row_height = full_row_height if full_height_by_periods[i] else half_row_height
        draw.rectangle([margin, period_positions[i], margin + header_col_width, period_positions[i] + row_height], fill="grey")
        text = period_names_filtered[i]
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        draw.text((margin + (header_col_width - text_width) / 2, period_positions[i] + (row_height - text_height) / 2), text, fill="black", font=font)

    # draw name
    text = short_name
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    draw.text((margin + (header_col_width - text_width) / 2, margin + (header_row_height - text_height) / 2), text, fill="black", font=font)


    # EVENTS

    for event in draw_events:
        day, period, subject, room, staff, colour = event

        full_height_override = False

        if period == tutorlunch_relative:
            period -= 1
            full_height_override = True
        elif period > tutorlunch_relative:
            period -= 1


        x = day_positions[day]
        y = period_positions[period]
        row_height = full_row_height if full_height_by_periods[period] else half_row_height

        if full_height_override:
            # combine heights of tutor and lunch
            row_height += full_row_height if full_height_by_periods[period+1] else half_row_height
            
        draw.rectangle([x, y, x + col_width, y + row_height], fill=colour)

        if full_height_by_periods[period] or full_height_override:
            text = f"{subject}\n{room} {staff}"
        else:
            text = f"{room} {staff}"
        
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        draw.text((x + (col_width - text_width) / 2, y + (row_height - text_height) / 2 - 1), text, fill="black", font=font)

    # draw gridlines
    draw.line([margin, margin, margin, margin + table_height], fill="black", width=1)
    for i in range(num_days):
        draw.line([day_positions[i], margin, day_positions[i], margin + table_height], fill="black", width=1)
    draw.line([margin + table_width, margin, margin + table_width, margin + table_height], fill="black", width=1)

    draw.line([margin, margin, margin + table_width, margin], fill="black", width=1)
    for i in range(num_periods):
        if not tutorlunch_relative == i:
            draw.line([margin, period_positions[i], margin + table_width, period_positions[i]], fill="black", width=1)
        else:
            draw.line([margin, period_positions[i], margin + header_col_width, period_positions[i]], fill="black", width=1)
            for j in range(num_days):
                draw_line = True
                for event in draw_events:
                    if event[0] == j and event[1] == i:
                        draw_line = False
                        break
                if draw_line:
                    draw.line([day_positions[j], period_positions[i], day_positions[j] + col_width, period_positions[i]], fill="black", width=1)
    draw.line([margin, margin + table_height, margin + table_width, margin + table_height], fill="black", width=1)




    # save
    image.save(path)

    print(f"Generated and saved a \"{mode}\" timetable for {name} to {path}.")


def generate_printable(io_path):
    scale = 0.5 # larger numbers shrink the timetables

    if not os.path.exists(io_path):
        print("Error generating printable timetable: folder does not exist.")
        return
    
    files = os.listdir(io_path)
    needed = ["w1.png", "w2.png", "normal.png", "full.png"]

    for file2 in needed:
        if not file2 in files:
            print(f"Error generating printable timetable: {file2} not found.")
            return
    
    # generate A4 size image
    a4_width =     2100
    a4_height =     2970


    image = Image.new('RGB', (a4_width, a4_height), 'white')

    # load images
    w1 = Image.open(f"{io_path}/w1.png")
    w2 = Image.open(f"{io_path}/w2.png")
    normal = Image.open(f"{io_path}/normal.png")
    full = Image.open(f"{io_path}/full.png")

    margin = 80

    # place images on sheet 1
    # image.paste(w1, (margin*2, margin*2))
    # image.paste(w2, (64 + 303 + 32, 64))
    # image.paste(normal, (64, 64 + 203 + 32))
    # image.paste(full, (64, 64 + 203 + 32 + 229 + 32))

    # shrink images
    w1 = w1.resize((int(w1.width // scale), int(w1.height // scale)))
    w2 = w2.resize((int(w2.width // scale), int(w2.height // scale)))
    normal = normal.resize((int(normal.width // scale), int(normal.height // scale)))
    full = full.resize((int(full.width // scale), int(full.height // scale)))

    w1_width_height = (w1.width, w1.height)
    w2_width_height = (w2.width, w2.height)
    normal_width_height = (normal.width, normal.height)
    full_width_height = (full.width, full.height)

    # place images on sheet 1
    image.paste(w1, (margin, margin))
    image.paste(w2, (margin + w1_width_height[0] + margin, margin))
    image.paste(normal, (margin, margin + w1_width_height[1] + margin))
    image.paste(full, (margin, margin + w1_width_height[1] + margin + normal_width_height[1] + margin))

    # save sheet 1
    image.save(f"{io_path}/printable_side1.png")

    # generate second sheet
    image = Image.new('RGB', (a4_width, a4_height), 'white')

    # place images on sheet 2
    # image.paste(w2, (a4_width - 64 - 303, 64))
    # image.paste(w1, (a4_width - 64 - 303 - 303 - 32, 64))

    # place images on sheet 2
    image.paste(w2, (a4_width-margin-w2_width_height[0], margin))
    image.paste(w1, (a4_width-margin-w2_width_height[0]-margin-w1_width_height[0], margin))

    # save sheet 2
    image.save(f"{io_path}/printable_side2.png")

    # save both sheets as PDF
    page1 = Image.open(f"{io_path}/printable_side1.png")
    page2 = Image.open(f"{io_path}/printable_side2.png")

    page1.save(f"{io_path}/printableD7CQ=.pdf", "PDF", resolution=100.0, save_all=True, append_images=[page2])

mass_pdfs = ""

if mass_pdfs == "":
    if not os.path.exists("input"):
        os.mkdir("input")
        print("Please put your PDFs and JSONs in the 'input' folder.")
        exit()

    pdfs_in = []
    jsons_in = []
    photos_in = []
    for file in os.listdir("input"):
        if file.endswith(".pdf"):
            pdfs_in.append(file)
        elif file.endswith(".json"):
            jsons_in.append(file)
        elif file.endswith(".jpg"):
            photos_in.append(file)

    if len(pdfs_in) == 0 and len(jsons_in) == 0:
        print("No PDFs or JSONs found in the 'input' folder.")
        # exit()

    if not os.path.exists("output"):
        os.mkdir("output")

    output_folder = f"output/{time.strftime('%Y%m%d_%H%M%S')}"

    os.mkdir(output_folder)

    created_folders = []

    for pdf in pdfs_in:
        name, short_name, tutor_group, events = load_from_pdf(f"input/{pdf}")

        folder_name = f"{name.lower().replace(' ', '-')}_{tutor_group}"

        if folder_name not in created_folders:
            os.mkdir(f"{output_folder}/{folder_name}")
            created_folders.append(folder_name)

        filename = f"{output_folder}/{folder_name}/{short_name.lower()}_timetable.json"
        save_json(name, short_name, tutor_group, events, filename)

    for json_filename in jsons_in:
        with open(f"input/{json_filename}") as f:
            data = json.load(f)
        if check_json_format(data, json_filename):
            name = data["name"]
            short_name = data["short"]
            tutor_group = data["tutor"]

            folder_name = f"{name.lower().replace(' ', '-')}_{tutor_group}"

            if folder_name not in created_folders:
                os.mkdir(f"{output_folder}/{folder_name}")
                created_folders.append(folder_name)

            renders_path = f"{output_folder}/{folder_name}/renders"
            
            os.mkdir(renders_path)
            
            for mode in ["w1", "w2", "normal", "full"]:
                generate_timetable_image(mode, data, f"{renders_path}/{mode}.png")
            
            generate_printable(f"{output_folder}/{folder_name}/renders")

    for image_filename in photos_in:
        print(image_filename)
        image = Image.open(f"input/{image_filename}")
        
        text = pytesseract.image_to_string(image)

        print(text)

        match = re.search(r"Timetable for (.+?)\s*,\s*(\w+)\s*,\s*(Week [AB])", text)

        found = False

        if match:
            name = match.group(1)
            tutor_group = match.group(2)
            week = match.group(3)

            print(f"Name: {name}")
            print(f"Tutor Group: {tutor_group}")
            print(f"Week: {week}")

            found = True
        
        if not found:
            match = re.search(r"Timetable for (.+?)\s*,\s*(\w+)", text)

            if match:
                name = match.group(1)
                tutor_group = match.group(2)

                print(f"Name: {name}")
                print(f"Tutor Group: {tutor_group}")

        # detect grids on image and display overlaying red boxes outlining the two grids (beneath the Timetable for texts)

else:
    # for pdf in folder masspdf
    if not os.path.exists(mass_pdfs):
        print("Error: masspdf folder does not exist.")
        exit()
    
    pdfs_in = []

    for file in os.listdir(mass_pdfs):
        if file.endswith(".pdf"):
            pdfs_in.append(file)

    if len(pdfs_in) == 0:
        print("No PDFs found in the 'masspdf' folder.")
        exit()
    
    if not os.path.exists("working"):
        os.mkdir("working")
    
    working_folders = []
    
    for pdf in pdfs_in:
        name, short_name, tutor_group, events = load_from_pdf(f"{mass_pdfs}/{pdf}")

        folder_name = f"{name.lower().replace(' ', '-')}_{tutor_group}"

        os.mkdir(f"working/{folder_name}")

        working_folders.append(folder_name)
        
        generate_timetable_image("w1", {"name": name, "short": short_name, "tutor": tutor_group, "events": events}, f"working/{folder_name}/w1.png")
        generate_timetable_image("w2", {"name": name, "short": short_name, "tutor": tutor_group, "events": events}, f"working/{folder_name}/w2.png")
        generate_timetable_image("normal", {"name": name, "short": short_name, "tutor": tutor_group, "events": events}, f"working/{folder_name}/normal.png")
        generate_timetable_image("full", {"name": name, "short": short_name, "tutor": tutor_group, "events": events}, f"working/{folder_name}/full.png")

        generate_printable(f"working/{folder_name}")
    
    if not os.path.exists("output"):
        os.mkdir("output")
    
    for folder_name in working_folders:
        # copy printable PDFS to output (COPY NOT MOVE)
        os.rename(f"working/{folder_name}/printableD7CQ=.pdf", f"output/{folder_name}.pdf")

    # combine all pdfs into one
    pdfs = []

    for pdf_generated in os.listdir("output"):
        if pdf_generated.endswith(".pdf"):
            pdfs.append(f"output/{pdf_generated}")
    
    pdfs.sort()

    pdf_writer = fitz.open()

    for pdf in pdfs:
        pdf_document = fitz.open(pdf)
        pdf_writer.insert_pdf(pdf_document)
        pdf_document.close()
    
    pdf_writer.save("output/MASTER.pdf")

    # delete working folder
    for folder_name in working_folders:
        os.remove(f"working/{folder_name}/w1.png")
        os.remove(f"working/{folder_name}/w2.png")
        os.remove(f"working/{folder_name}/normal.png")
        os.remove(f"working/{folder_name}/full.png")
        os.remove(f"working/{folder_name}/printable_side1.png")
        os.remove(f"working/{folder_name}/printable_side2.png")
        os.rmdir(f"working/{folder_name}")
    
    os.rmdir("working")


        
    
