# Project overview

This project is a bachelor project for software development. It is a DEMO project, but with abilities of being a
full fletched project down the line.

The project is:
- A website for people who skin FiveM clothing, to make the process easier.

Some of the features it should have: 
- The ability of saving a clothing template (PNG) directly in the browser. 
- The ability for users to add a new template, and pre-define zones on the PNG for adding logos, color and textures.
- The ability for users to relocate the logo, even tho there are pre-defined zones. So a way of either using the predefined zones or move the logo
- The ability of users to change the size of the PNG and save the file as a PNG

Avoid over-engineering. Prefer clarity over cleverness.

## Key commands
- `npm start`: starts the project to localhost:8000

## 1. Tech stack

JavaScript

Do not introduce redux, material UI or styled-components unless told to.


## 2. UI design

Rules: 
- Prefer 8px spacing rhythm
- Buttons should have clear primary/secondary hierachy
- Every interactive element must have visible hover, focus and disabled states

## 3. Copy and content guidance
- Use concise, confident language
- Headlines should be clear before clever
- Prefer short paragraphs and scannable structure
- Do not install dependencies without explicit approval. This demo is dependency-free on purpose
- Do not read `.env`, private keys, keypairs, or secret files. Use `.env.example` only
- Do not replace the app with a framework. The point is to keep setup concept visible