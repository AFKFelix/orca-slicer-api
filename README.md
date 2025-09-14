# OrcaSlicer API

A RESTful service that leverages the OrcaSlicer CLI to slice 3D models (STL, STEP, 3MF).

This project only provides an REST API to the OrcaSlicer CLI, full credit to the [OrcaSlicer](https://github.com/SoftFever/OrcaSlicer) contributors for the slicer itself.

## Features

- Slice models (STL, STEP, and 3MF) using OrcaSlicer and the profiles exported from it
- Export sliced models as a single G-code or 3MF (with G-code included) file, or as a ZIP file containing multiple G-code files
- Set parameters such as plate numbers, auto-arrange, auto-orient, filament, and more.

## Requirements 

- **Node.js** v22
- **OrcaSlicer** (tested on Linux with AppImage and MacOS)

## Installation

### Production

> **WARNING:**
> This project is still in early development and may not be suitable for real production use yet. Use at your own risk and ensure you add proper security measures.

#### Docker (Recommended)

You can run the service in a Docker container. This was tested on Linux for now only and might still have some issues.

Run the following commands to set up and start the Docker container (you can change the OrcaSlicer version and architecture (arm64/amd64) as needed):

```bash
git clone https://github.com/AFKFelix/orca-slicer-api.git
cd orca-slicer-api
docker build --build-arg ORCASLICER_VERSION=2.3.0 --build-arg TARGETARCH=amd64 -t orca-slicer-api .
docker run -d -p 3000:3000 --name orca-slicer-api orca-slicer-api
```

#### Setup Script

Use the provided setup script to automate installation, configuration, and PM2 setup (Unix only):

```bash
curl -O https://raw.githubusercontent.com/AFKFelix/orca-slicer-api/main/setup.sh
chmod +x setup.sh
./setup.sh
```

The script will:

- Check for required dependencies
- Clone the repository
- Prompt for configuration
- Install dependencies and build the project
- Start the API with PM2 and optionally set up auto-start

Note: This setup works best with the AppImage version of OrcaSlicer. It has been tested successfully on Ubuntu (x86_64) using the AppImage, as well as on Debian running on a Raspberry Pi 4 (ARM64) via Flatpak.
If you're using the Flatpak version, make sure to grant it access to the temporary directory, as this is required for slicing operations. Additionally, you will need to create a wrapper script or similar solution that can serve as the executable path to the OrcaSlicer binary.

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
`PORT` (optional): Port to run the server on, defaults to 3000.

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

## Roadmap

There are still several improvements planned:

- ~~Multi-plate slicing support~~ (added for 3MF files, returns ZIP of G-codes)
- ~~Enhanced slicing options~~
- ~~Improved error handling~~
- Better profile management system
- Strengthened security measures
- Additional quality-of-life features
- Auto install of OrcaSlicer on setup script
- Windows setup support
- Better documentation
- Tests and CI/CD setup

Feedback is welcome!

## API Endpoints

You can check the Swagger file in the project root or go to /api-docs when running in development.
