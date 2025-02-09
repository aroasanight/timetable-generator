file = input("Which file would you like to load? ")

import json
from PIL import ImageColor

valid_colours = []
for name, code in ImageColor.colormap.items():
    valid_colours.append(name)

with open(f"input/{file}.json") as f:
    data = json.load(f)

lessons = data["events"]

subjects = []

for lesson in lessons:
    if [lesson[2], lesson[5]] not in subjects:
        subjects.append([lesson[2], lesson[5]])

print("\nSubjects found:")
for subject in subjects:
    print(f" - {subject[0]} (currently {subject[1]})")

print("\nNow replacing colours...")

for subject in subjects:
    colour = input(f"Enter a new colour for {subject[0]}: ").strip().lower()
    valid = False
    while not valid:
        if colour in valid_colours:
            subject[1] = colour
            valid = True
        else:
            print("Invalid colour. Please try again.")
            colour = input(f"Enter a new colour for {subject[0]}: ").strip().lower()

for lesson in lessons:
    for subject in subjects:
        if lesson[2] == subject[0]:
            lesson[5] = subject[1]

print("\nUpdated colours:")
for subject in subjects:
    print(f" - {subject[0]} is now {subject[1]}")

print(f"\nWriting to file input/{file}_updatedcolours.json...")

with open(f"input/{file}_updatedcolours.json", "w") as f:
    json.dump({"name": data["name"], "events": lessons}, f, indent=4)