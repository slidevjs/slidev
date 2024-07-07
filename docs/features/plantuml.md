---
layout: feature
relates:
  - Plant UML: https://plantuml.com/
  - Plant UML Live Editor: https://plantuml.com/plantuml
  - Example side: https://sli.dev/demo/starter/12
  - feature/mermaid
description: |
  Create diagrams from textual descriptions, powered by PlantUML.
---

# PlantUML Diagrams

You can create PlantUML diagram easily in your slides, for example:

````md
```plantuml
@startuml
Alice -> Bob : Hello!
@enduml
```
````

The source code will be send to https://www.plantuml.com/plantuml to render the diagram by default. You can also setup your own server by setting the `plantUmlServer` in the [Slidev configuration](../custom/index#headmatter).

Visit the [PlantUML Website](https://plantuml.com/) for more information.
