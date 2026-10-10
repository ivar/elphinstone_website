---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
weight: 10
color: "primary"      # primary (teal) | secondary (green) | accent (gold) | neutral (navy)
icon: "plant"         # plant | book | people — see data/icons.yaml
status: "Planning"    # e.g. Planning, Early stage, In progress, Coming soon
# started: 2026-01-01
summary: "One sentence shown on the projects page and under the title."
# cover: "cover.jpg"  # optional wide photo stored in this folder
# coverAlt: "Describe the cover photo"
intention:
  - "Why we're doing this — first paragraph."
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
