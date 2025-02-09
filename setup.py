from PIL import ImageColor

def divider():
    print()
    print("--------------------------------------------------")
    print()

def yn(question):
    while 1 != "fish":
        response = input(question+" (y/n) ").lower()
        if response == "y" or response == "n":
            return response == "y"
        else:
            print("Please answer with either 'y' or 'n'.")

strings_periods = [
    "during morning tutor",
    "during period 1",
    "during period 2",
    "during break",
    "during period 3",
    "during afternoon tutor",
    "during lunch",
    "during period 4",
    "during period 5",
    "after school"
]
strings_days = [
    "WEEK A - MONDAY",
    "WEEK A - TUESDAY",
    "WEEK A - WEDNESDAY",
    "WEEK A - THURSDAY",
    "WEEK A - FRIDAY",
    "WEEK B - MONDAY",
    "WEEK B - TUESDAY",
    "WEEK B - WEDNESDAY",
    "WEEK B - THURSDAY",
    "WEEK B - FRIDAY"
]

valid_colours = []
for name, code in ImageColor.colormap.items():
    valid_colours.append(name)

def getlessons():
    lessons = []

    last = []
    i = 0
    last_day = -1

    while i < (len(strings_periods)*len(strings_days)):
        if i // len(strings_periods) != last_day:
            divider()
            print(strings_days[i // len(strings_periods)])
            divider()
            last_day = i // len(strings_periods)
        # print(lessons)
        if enabled[i % len(strings_periods)]:
            period = strings_periods[i % len(strings_periods)]
            day = strings_days[i // len(strings_periods)]
            subject = input(f"What subject do you have {period} on {day}? ").strip().capitalize()[:5]
            if subject in ["Pe", "Re", "It", "Cr", "Pse", "Pde", "Pshe"]:
                subject = subject.upper()
            if subject == "Undo":
                if len(last) == 0:
                    print("You can't undo any further.")
                else:
                    i = last.pop()
                    for lesson in lessons:
                        if (lesson[0] == i // len(strings_periods) and lesson[1] == i % len(strings_days)):
                            lessons.remove(lesson)
                i -= 1
            elif subject == "":
                last.append(i)
            else:
                room = input(f"What room is {subject} in? ").strip().upper().replace(" ", "")[:4]
                teacher = input(f"What are the teacher's initials on your existing timetable for {subject}? ").strip().upper()[:3]
                lessons.append((i // len(strings_periods), i % len(strings_days), subject, room, teacher, "white"))
                print(f"\nWe got {subject} in {room} with {teacher}. If this is wrong, type Undo and try again.\n")
                last.append(i)
        i += 1
    
    return lessons

def replacecolours(subjects):
    for subject in subjects:
        colour = input(f"What colour would you like {subject[0]} to be? ").strip().lower()
        while colour not in valid_colours:
            colour = input(f"\"{colour}\" is not a valid colour. Please try again. ").strip().lower()
        subject[1] = colour
    return subjects

divider()

name = input("Enter your preferred first name: ").capitalize()[:6]

divider()

print(f"Hi, {name}!")
print("If part of your name is cut off, unfortunately names are capped at 6 characters. Try a nickname instead if it's an issue :)")
print("In these following questions, \"regularly\" means at least once over the two week timetable.")
input("Press enter to continue.")

divider()

enabled = []
for period in strings_periods:
    enabled.append(yn(f"Do you regularly have an event {period}?"))

divider()

print("We'll now ask you what events you have, and when.")
print("IMPORTANT: If you have an event at lunch, this WILL cover both afternoon tutor AND lunch.")
print("Therefore, if you have, for example, a lunch lesson, Enter it ONLY AT LUNCH. If you enter for both, you will see duplicates.")
input("Press enter to continue.")

divider()

print("For each period of each day, enter the SHORTENED SUBJECT NAME (max 5 characters). For example, shorten Science to Sci, and Guitar to Guit.")
print("If you don't have a lesson, leave blank and press enter.")
print("If you made a typo, type UNDO and press enter to go back by one.")
print("Keep in mind that this only works when you're being asked for the SUBJECT - so if you make a typo in the subject name, type whatever you want for the room and staff initials, THEN type undo when asked for your next subject.")
input("Press enter to continue.")

# divider in getlessons()
lessons = getlessons()
print(lessons)

divider()

print("We got the following lessons:\n")
for day in strings_days:
    has_lessons = False
    print(day)
    for lesson in lessons:
        if lesson[0] == strings_days.index(day):
            has_lessons = True
            print(f" - {strings_periods[lesson[1]]} - {lesson[2]} in {lesson[3]} with {lesson[4]}")
    if not has_lessons:
        print(" - No lessons")
    print()
input("Double-check this against your timetable, then press enter to continue.")

divider()

subjects = []
for lesson in lessons:
    if [lesson[2], lesson[5]] not in subjects:
        subjects.append([lesson[2], lesson[5]])

print("We've detected the following unique subjects:")
for subject in subjects:
    print(f" - {subject[0]}")
print()
print("We'll now ask you to assign colours to each subject.")
print("You can use most CSS colour names (we'll let you retry if it's not in the valid list).")
input("Press enter to continue.")

divider()

subjects = replacecolours(subjects)

new_lessons = []

for lesson in lessons:
    for subject in subjects:
        if lesson[2] == subject[0]:
            new_lessons.append((lesson[0], lesson[1], lesson[2], lesson[3], lesson[4], subject[1]))

divider()

print(f"We're done and have now spat out a JSON file for you (named {name.lower()}.json). Place this in the \"input\" folder, and then run main.py.")
print("If you need to make changesin future without redoing your whole timetable, you can always edit the JSON file directly.")

import json

with open(name.lower()+".json", "w") as f:
    json.dump({"name": name, "events": new_lessons}, f, indent=4)