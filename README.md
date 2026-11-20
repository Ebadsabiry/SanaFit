# SanaFit

SanaFit is a home workout guide for strength, muscle, and healthy body-weight gain. It follows Sana’s weekly schedule: Saturday lower body and glutes, Monday upper body and core, Wednesday full body and glutes, with recovery days between sessions. It includes exercise instructions, home equipment, sets and reps, warm-ups, progression guidance, attendance tracking, and printable plans.

## Project files

- `src/program.ts` contains the recurring weekly plan, exercises, warm-up, set and rep targets, and progression guidance.
- `src/catalog.ts` contains the equipment and movement-specific setup, form, breathing, and safety cues.
- `src/App.tsx` builds the workout, weekly plan, exercise directory, and progress screens.
- Attendance and preferences are stored locally in this browser.

## Run locally

Install Node.js 22.12 or newer and npm. In the project directory:

```sh
npm ci
npm run dev
```

Vite prints the local address, usually `http://localhost:5173/`.

## Build

```sh
npm run build
```

The production files are written to `dist/`.
