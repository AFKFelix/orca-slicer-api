# OrcaSlicer API

A RESTful service that leverages the OrcaSlicer CLI to slice 3D models (STL, STEP, 3MF).

This project only provides an REST API to the OrcaSlicer CLI, full credit to the [OrcaSlicer](https://github.com/SoftFever/OrcaSlicer) contributors for the slicer itself.

## Requirements 

- **Node.js** v22
- **OrcaSlicer** (tested on Unix with AppImage)

## Installation

### Local

```bash
git clone https://github.com/AFKFelix/orca-slicer-api.git
cd orca-slicer-api

# Create a .env file in the project root:
# .env example
ORCASLICER_PATH=/your/path/OrcaSlicer
DATA_PATH=/your/path/data
ENV=dev
DATABASE_URL=file:./dev.db

# Install dependencies
npm install

# Set up the local SQLite database with Prisma
npx prisma migrate deploy

# Start the dev server
npm run dev
```

## Configuration

`ORCASLICER_PATH` (required): Absolute path to the OrcaSlicer binary.\
`DATA_PATH` (required): Base directory for user uploaded profiles.\
`ENV` (required): Sets if run in development (dev) or production (prod)\
`DATABASE_URL` (required): Path to the SQLite database file

Profiles are stored under:

```
<DATA_PATH>/
├── printers/
├── presets/
└── filaments/
```

Each profile is a JSON file from OrcaSlicer.

Models are stored under:

```
<DATA_PATH>/
└── models/
```

## Database

This project uses a local SQLite database for storing model metadata using [Prisma](https://www.prisma.io/).\
The database file is created automatically based on the `DATABASE_URL`.

## Security

**WARNING**: No authentication or authorization is implemented. This service should never be exposed directly to the public internet without adding proper security layers.

## Roadmap

There are still several improvements planned:

- ~~Multi-plate slicing support~~ (added for 3MF files, returns ZIP of G-codes)
- Enhanced slicing options
- ~~Improved error handling~~
- Better profile management system
- Strengthened security measures
- Additional quality-of-life features

Feedback is welcome!

## API Endpoints

You can check the Swagger file in the project root or go to /api-docs when running in development.
