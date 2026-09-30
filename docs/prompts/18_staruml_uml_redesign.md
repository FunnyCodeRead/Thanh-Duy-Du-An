# STARUML UML REDESIGN

## Goal
Vẽ lại toàn bộ UML theo UML 2.x và dựng bằng StarUML.

Final source:
`docs/uml/AI_Recruitment_System.mdj`

Không chỉ xuất ảnh.

## Diagrams
- 1 Use Case Overview
- 14 Activity Diagrams
- 14 Sequence Diagrams
- 1 Application State Machine
- 1 Entity Class Diagram
- 1 Controller/Service Class Diagram
- 1 Component Diagram

## Use Case rules
- Actors outside boundary.
- Use Cases inside boundary.
- Association: solid line.
- Generalization: solid + hollow triangle.
- ADMIN specializes HR.
- Do not abuse include/extend.

## Activity rules
Use:
- Initial Node
- Action
- Decision
- Merge
- Guard `[condition]`
- Activity Final
- Partitions/swimlanes

## Sequence rules
Use:
- Actor
- Boundary
- Controller
- Service
- Database
- External
- Activation bars
- sync messages
- dashed returns
- alt/opt/loop
- guards

## Class syntax
- `-id: int`
- `+name: string`
- `+operation(param: Type): ReturnType`

Relations must show multiplicity. Do not fake inheritance.

## State Machine
States:
- NEW
- SCREENING
- INTERVIEW
- PASSED
- REJECTED

Only valid transitions.

## Component
- React SPA
- Flask REST API
- MySQL
- AI Module
- RAG Module
- FAISS
- Embedding Model
- Gemini
- CV Storage

React must never call Gemini directly.

## Deliverables
- editable `.mdj`
- SVG exports
- PNG exports
- UML validation report

Diagrams must describe implemented behavior, not invent new architecture.
