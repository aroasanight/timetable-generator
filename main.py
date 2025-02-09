# load staff and subjects jsons

import json
import os

def load_staff():
    with open(os.path.join(os.path.dirname(__file__), 'staff.json')) as f:
        return json.load(f)

def load_subjects():
    with open(os.path.join(os.path.dirname(__file__), 'subjects.json')) as f:
        return json.load(f)
    
staff = load_staff()
subjects = load_subjects()


days = [
    "Monday A",
    "Tuesday A",
    "Wednesday A",
    "Thursday A",
    "Friday A",
    "Monday B",
    "Tuesday B",
    "Wednesday B",
    "Thursday B",
    "Friday B"
]

periods = [
    "Before school",
    "AM Tutor",
    "Period 1",
    "Period 2",
    "Break",
    "Period 3",
    "PM Tutor",
    "Lunch",
    "Period 4",
    "Period 5",
    "After school"
]


name = "19wilde"

# load timetable
def load_timetable(name):
    with open(os.path.join(os.path.dirname(__file__), name + '.json')) as f:
        return json.load(f)
    
data = load_timetable(f"timetables/{name}")

lessons = data["dict"]
timetable = data["times"]

for day in range(1,11):
    for period in range(1,12):
        # check if key exists
        if str(day) in timetable:
            if str(period) in timetable[str(day)]:
                ldata = timetable[str(day)][str(period)]
                subjectname = lessons[str(ldata[0])]["subject"]
                staffcode = lessons[str(ldata[0])]["teacher"]
                staffname = staff[staffcode]
                room = ldata[1]


                print(f"{days[day-1]} {periods[period-1]}: {subjectname} with {staffname} ({staffcode}) in {room}")



            else:
                print(f"{days[day-1]} {periods[period-1]}:")
        else:
            print(f"{days[day-1]} {periods[period-1]}:")