# OrcaSlicer API

A RESTful service to slice 3D models (STL, STEP, 3MF) using the OrcaSlicer CLI.

This project only provides an REST API to the OrcaSlicer CLI, full credit to the [OrcaSlicer](https://github.com/SoftFever/OrcaSlicer) contributors for the slicer itself.

## Features

- Slice models (STL, STEP, and 3MF) using OrcaSlicer and the profiles exported from it
- Export sliced models as a single G-code or 3MF (with G-code included) file, or as a ZIP file containing multiple G-code files
- Set parameters such as plate numbers, auto-arrange, auto-orient, filament, and more.
- Slice models asynchronously with a simple job system. (Experimental, see [Async Slicing](#async-slicing) for details)
- Use system profiles by name, or upload profiles per request that can inherit from system profiles

## Supported OrcaSlicer Versions

| Version | Tests | Verified Docker Environments            |
| ------- | ----- | --------------------------------------- |
| 2.3.0   | ✅    | Ubuntu (amd64), Raspberry Pi OS (arm64) |
| 2.4.0   | ✅    | ⏳ Not yet verified                     |
| 2.4.2   | ✅    | ⏳ Not yet verified                     |

## Project Scope

This project is designed to be a **minimal slicing backend**, not a complete slicing platform or standalone application.

The primary use case is to run it as a small service or sidecar that other applications can call to slice 3D models and retrieve information such as estimated print time, filament usage and generated G-code.

The project intentionally is minimal. Responsibilities such as authentication, authorization, input validation, persistent job storage, user profile management, rate limiting and similar should be implemented by the service using this API.

## Setup

### Production

> **WARNING:**
> This project is still in development and may not be suitable for real production use yet. Use at your own risk and ensure you add proper security measures.

#### Docker

Prebuilt multi-arch images are published to GitHub Container Registry at `ghcr.io/afkfelix/orca-slicer-api`.

Pull and run the latest image for a supported OrcaSlicer version:

```bash
docker pull ghcr.io/afkfelix/orca-slicer-api:latest-orca2.4.2
mkdir ./system-profiles
docker run -d \
  --name orca-slicer-api \
  -p 3000:3000 \
  -v "./system-profiles:/app/system-profiles" \
  ghcr.io/afkfelix/orca-slicer-api:latest-orca2.4.2
```

Release images are also published with tags in the format `v<api-version>-orca<orca-version>`, for example:

```bash
docker pull ghcr.io/afkfelix/orca-slicer-api:v0.4.0-orca2.4.2
```

If you want to build the image locally instead use:

```bash
git clone https://github.com/AFKFelix/orca-slicer-api.git
cd orca-slicer-api
docker build --build-arg ORCA_VERSION=2.4.2 -t orca-slicer-api .
docker run -d -p 3000:3000 --name orca-slicer-api -v "./system-profiles:/app/system-profiles" orca-slicer-api
```

### Local (Development)

```bash
git clone https://github.com/AFKFelix/orca-slicer-api.git
cd orca-slicer-api

# Create a .env file in the project root:
# .env example
ORCASLICER_PATH=/your/path/OrcaSlicer
ORCASLICER_RESOURCES_PATH=/your/path/OrcaSlicer/resources
ORCASLICER_VERSION=YourOrcaSlicerVersion
SYSTEM_PROFILE_PATH=/your/path/system-profiles
NODE_ENV=development
PORT=3000

# Install dependencies and start the dev server
npm install
npm run dev
```

## Configuration

`ORCASLICER_PATH` (required): Absolute path to the OrcaSlicer binary.\
`ORCASLICER_RESOURCES_PATH` (required): Absolute path to the OrcaSlicer resources directory, which contains the default profiles.\
`ORCASLICER_VERSION` (required): Version of the installed OrcaSlicer, e.g. `2.4.2`.\
`SYSTEM_PROFILE_PATH` (optional): Base directory for system profiles. Defaults to `./system-profiles`.\
`NODE_ENV` (required): Sets if run in development or production.\
`PORT` (optional): Port to run the server on, defaults to 3000.\
`ASYNC_SLICE_RETENTION_MS` (optional): Time in milliseconds to retain asynchronous slice jobs, defaults to 3600000 (60 minutes). Cleanup runs every 60 minutes.

Only system profiles are supported, they are extracted from the OrcaSlicer resources directory on startup and stored as:

```
<SYSTEM_PROFILE_PATH>/<ORCASLICER_VERSION>/
├── index.json
└── <uuid>.json
```

Each profile is a JSON file from OrcaSlicer, with inheritance already resolved.
The `index.json` file contains a map of the actual profile names to the UUID filenames. Index entries are stored as filenames and resolved with the setuped directory from the `SYSTEM_PROFILE_PATH` and `ORCASLICER_VERSION` environment variables when needed.

User profiles cannot be created or modified through the API. Profiles that should be used for slicing are either referenced by name (resolved against the system profiles) or uploaded per request, in which case they are only used for that single slicing job and never stored.

## Security

**WARNING**: No authentication or authorization is implemented. This service should never be exposed directly to the public internet without adding proper security layers.

## Async Slicing

The API supports asynchronous slicing via the `/slice-async` endpoint to handle bigger models that take longer to slice, without running into HTTP timeouts.
When you submit a slicing job to this endpoint, it will return a unique `requestId` that you can use to check the status of the job and retrieve the results once it's completed. All jobs will run in the background in parallel, so there is no real queue system.

Please also note that the jobs are only stored in memory and should be deleted after retrieval. If not deleted, they will be automatically removed after the time specified in `ASYNC_SLICE_RETENTION_MS` (default is 60 minutes).

This feature is still experimental and might change in future releases, feedback is welcome!

## API Endpoints

You can check the Swagger file in the project root or go to /api-docs when running in development.

## Migration Notes

**v0.4.0:**
The user profiles supported in versions v0.3.0 and earlier are no longer supported.
They won't be deleted, but are no longer available for use.
The new version only supports system profiles and per-request uploaded profiles.
