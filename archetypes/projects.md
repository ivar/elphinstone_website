---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
weight: 10
color: "primary"      # primary (teal) | secondary (green) | accent (gold) | neutral (navy)
icon: "plant"         # plant | seedling | agroforestry | fruit-tree | apple | blueberry | carrot | hoop-house | palm-house | wetland | soil | solar | book | people | search (see data/icons.yaml)
status: "Planning"    # e.g. Planning, Early stage, In progress, Coming soon
# started: 2026-01-01
summary: "One sentence shown on the projects page and under the title."
# location:           # optional marker on the projects map, in % from the left/top of the overhead photo;
#   x: 50             # in `npm run dev`, click the photo on /projects/ to get these
#   y: 50
#   area: [[40, 40], [60, 40], [60, 60], [40, 60]]   # optional: corners of a highlighted, clickable patch
#   label: "left"     # optional: put the label left of the marker
# cover: "cover.jpg"  # optional wide photo, in this folder or in the media bucket under this project's folder name
# coverAlt: "Describe the cover photo"
intention:
  - "Why we're doing this — first paragraph."
# courses:            # optional course cards in the sidebar; the course's own HTML goes in static/projects/<slug>/<course>/index.html
#   - title: "Course name"
#     meta: "Eight short sessions"
#     text: "What it covers."
#     url: "/projects/<slug>/<course>/"
# openproject: ["project-identifier"]   # optional: show this OpenProject project's open tasks under "Next tasks" (subprojects included)
# tasksMatch: "apple"                   # optional: only tasks whose title matches; tasksExclude does the opposite
learnTitle: "The idea behind it"
# involve: "Optional custom text for the Get involved box."
updates: []
# updates:
#   - date: 2026-05-10
#     title: "What happened"
#     text: "A few sentences. **Markdown** works."
#     why: "Optional: the reasoning behind this step."
#     photos:
#       - src: "2026-05-photo.jpg"
#         alt: "Describe the photo"
#         caption: "Optional caption"
---

Educational background goes here: what the idea is, how it works, and why it matters.
Use the term shortcode for definitions:
{{`{{< term "succession" >}}The natural sequence by which plant communities replace one another.{{< /term >}}`}}
