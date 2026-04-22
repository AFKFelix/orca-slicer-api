# OrcaSlicer API

A RESTful service that leverages the OrcaSlicer CLI to slice 3D models (STL, STEP, 3MF).

This project only provides an REST API to the OrcaSlicer CLI, full credit to the [OrcaSlicer](https://github.com/SoftFever/OrcaSlicer) contributors for the slicer itself.

## Features

- Slice models (STL, STEP, and 3MF) using OrcaSlicer and the profiles exported from it
- Export sliced models as a single G-code or 3MF (with G-code included) file, or as a ZIP file containing multiple G-code files
- Set parameters such as plate numbers, auto-arrange, auto-orient, filament, and more.
- Slice models asynchronously with a simple job system. (Experimental, see [Async Slicing](#async-slicing) for details)

## Requirements 

- **Node.js** v22
- **OrcaSlicer** (tested on Linux with AppImage and MacOS)

## Installation

### Production

> **WARNING:**
> This project is still in early development and may not be suitable for real production use yet. Use at your own risk and ensure you add proper security measures.

#### Docker

Prebuilt multi-arch images are published to GitHub Container Registry at `ghcr.io/afkfelix/orca-slicer-api`.

Pull and run the latest image for a supported OrcaSlicer version:

```bash
docker pull ghcr.io/afkfelix/orca-slicer-api:latest-orca2.3.0
mkdir ./data
docker run -d \
  --name orca-slicer-api \
  -p 3000:3000 \
  -v "./data:/app/data" \
  ghcr.io/afkfelix/orca-slicer-api:latest-orca2.3.0
```

Release images are also published with tags in the format `v<api-version>-orca<orca-version>`, for example:

```bash
docker pull ghcr.io/afkfelix/orca-slicer-api:v0.3.0-orca2.3.0
```

If you want to build the image locally instead use:

```bash
git clone https://github.com/AFKFelix/orca-slicer-api.git
cd orca-slicer-api
docker build --build-arg ORCA_VERSION=2.3.0 -t orca-slicer-api .
docker run -d -p 3000:3000 --name orca-slicer-api orca-slicer-api
```

### Local (Development)

```bash
git clone https://github.com/AFKFelix/orca-slicer-api.git
cd orca-slicer-api

# Create a .env file in the project root:
# .env example
ORCASLICER_PATH=/your/path/OrcaSlicer
DATA_PATH=/your/path/data
NODE_ENV=development
PORT=3000

# Install dependencies and start the dev server
npm install
npm run dev
```

## Configuration

`ORCASLICER_PATH` (required): Absolute path to the OrcaSlicer binary.\
`DATA_PATH` (required): Base directory for user uploaded profiles.\
`NODE_ENV` (required): Sets if run in development or production.\
`PORT` (optional): Port to run the server on, defaults to 3000.\
`ASYNC_SLICE_RETENTION_MS` (optional): Time in milliseconds to retain asynchronous slice jobs, defaults to 3600000 (60 minutes). Cleanup runs every 60 minutes.

Profiles are stored under:

```
<DATA_PATH>/
├── printers/
├── presets/
└── filaments/
```

Each profile is a JSON file from OrcaSlicer.

## Security

**WARNING**: No authentication or authorization is implemented. This service should never be exposed directly to the public internet without adding proper security layers.

## Async Slicing

The API supports asynchronous slicing via the `/slice-async` endpoint to handle bigger models that take longer to slice, without running into HTTP timeouts.
When you submit a slicing job to this endpoint, it will return a unique `requestId` that you can use to check the status of the job and retrieve the results once it's completed. All jobs will run in the background in parallel, so there is no real queue system.

Please also note that the jobs are only stored in memory and should be deleted after retrieval. If not deleted, they will be automatically removed after the time specified in `ASYNC_SLICE_RETENTION_MS` (default is 60 minutes).

This feature is still experimental and might change in future releases, feedback is welcome!

## Roadmap

There are still several improvements planned:

- ~~Multi-plate slicing support~~ (added for 3MF files, returns ZIP of G-codes)
- ~~Enhanced slicing options~~
- ~~Improved error handling~~
- Better profile management system
- Strengthened security measures
- Additional quality-of-life features
- Better documentation
- ~~Tests and CI/CD setup~~

Feedback is welcome!

## API Endpoints

You can check the Swagger file in the project root or go to /api-docs when running in development.
