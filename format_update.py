# list files in timetables directory

import os, json
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

    for day, times in lessons_in.items():
        for time, lesson in times.items():
            subject = lessons_dict[str(lesson[0])]["subject"]
            room = lesson[1]
            teacher = lessons_dict[str(lesson[0])]["teacher"]
            color = lessons_dict[str(lesson[0])]["color"]
            lessons.append([int(day)-1, int(time)-2, subject, room, teacher, color])

    print(lessons)

    with open("input/"+name.lower()+"_updated.json", "w") as f:
        json.dump({"name": data["name"], "events": lessons}, f, indent=4)
