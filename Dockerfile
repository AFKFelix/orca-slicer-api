FROM node:22-bookworm AS build

ARG ORCA_VERSION=2.3.1
ARG TARGETARCH

WORKDIR /app

# Download OrcaSlicer based on architecture
# AMD64: Use official AppImage from SoftFever/OrcaSlicer
# ARM64: Use custom-built AppImage from kldzj/orca-slicer-arm64
RUN if [ "$TARGETARCH" = "arm64" ]; then \
      echo "Downloading ARM64 AppImage from kldzj/orca-slicer-arm64..."; \
      curl -o orca.AppImage -L "https://github.com/kldzj/orca-slicer-arm64/releases/download/v${ORCA_VERSION}-arm64/OrcaSlicer-${ORCA_VERSION}-arm64-linux.AppImage"; \
      chmod +x orca.AppImage; \
      ./orca.AppImage --appimage-extract; \
      rm orca.AppImage; \
    else \
      echo "Downloading AMD64 AppImage from SoftFever/OrcaSlicer..."; \
      curl -o orca.AppImage -L "https://github.com/SoftFever/OrcaSlicer/releases/download/v${ORCA_VERSION}/OrcaSlicer_Linux_AppImage_Ubuntu2404_V${ORCA_VERSION}.AppImage"; \
      chmod +x orca.AppImage; \
      ./orca.AppImage --appimage-extract; \
      rm orca.AppImage; \
    fi

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM ubuntu:24.04

RUN apt-get update \
	&& apt-get upgrade -y \
	&& apt-get install -y --no-install-recommends \
		curl ca-certificates gnupg \
	&& mkdir -p /etc/apt/keyrings \
	&& curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
	&& echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
	&& apt-get update \
	&& apt-get install -y --no-install-recommends \
		nodejs \
		libgl1 libgl1-mesa-dri libegl1 \
		libgtk-3-0 \
		libgstreamer1.0-0 libgstreamer-plugins-base1.0-0 \
		libwebkit2gtk-4.1-0 \
	&& update-ca-certificates \
	&& rm -rf /var/lib/apt/lists/*


COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/squashfs-root /app/squashfs-root

ENV PORT=3000
ENV ORCASLICER_PATH=/app/squashfs-root/AppRun
ENV DATA_PATH=/app/data
ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "app/dist/index.js"]