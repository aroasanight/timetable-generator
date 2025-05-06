import json
import os

to_convert = []

for file in os.listdir("input"):
    if file.endswith(".json"):
        to_convert.append(file.replace(".json", ""))


for timetable in to_convert:
    with open(f"input/{timetable}.json") as f:
        data = json.load(f)

    name = data["name"]
    shortname = data["short"]
    tutor = data["tutor"]

    lessons = data["events"]

    for lesson in lessons:
        if lesson[1] >= 6:
            lesson[1] += 1
        
        translate = [
            ["Comp", "mediumslateblue", ["computing"]],
            ["Maths", "skyblue", ["maths"]],
            ["Music", "mediumseagreen", ["music"]],
            ["Study", "orange", ["6th form study"]],
            ["Tutor", "lightgrey", [": gb", ": pp", ": vf", ": de", ": bw", ": nr", "10: a4", "10: w4", "10: f4", "10: g4", "10: n4", "11: a5", "11: w5", "11: f5", "11: g5", "11: n5", " a1", " a2", " a3", " w1", " w2", " w3", " g1", " g2", " g3", " f1", " f2", " f3", " n1", " n2", " n3"]],
            ["CR", "lightcoral", ["citizenship"]],
            ["PE", "royalblue", ["pe"]],
            ["Sci", "limegreen", ["science"]],
            ["Phys", "limegreen", ["physics"]],
            ["Chem", "limegreen", ["chemistry"]],
            ["Bio", "limegreen", ["biology"]],
            ["Eng", "tomato", ["english"]],
            ["Hist", "gold", ["history"]],
            ["Geog", "orange", ["geography"]],
            ["RE", "hotpink", ["religious"]],
            ["Fr", "lightcoral", ["french"]],
            ["Sp", "lightcoral", ["spanish"]],
            ["Drama", "pink", ["drama"]],
            ["Dance", "palevioletred", ["dance"]],
            ["Art", "crimson", ["art"]],
        ]

        for subject in translate:
            if lesson[2] == subject[0]:
                lesson[5] = subject[1]
    
    with open(f"input/{timetable}_converted.json", "w") as f:
        json.dump({"name": name, "short": shortname, "tutor": tutor, "events": lessons}, f, indent=4)