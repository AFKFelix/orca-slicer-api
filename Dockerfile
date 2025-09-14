FROM node:22-bookworm AS build

WORKDIR /app

ARG ORCASLICER_VERSION

RUN if [ -z "$ORCASLICER_VERSION" ]; then \
      echo "ORCASLICER_VERSION not set"; \
      exit 1; \
    else \
      echo "ORCASLICER_VERSION is $ORCASLICER_VERSION"; \
    fi

RUN curl -o orca.AppImage -L "https://github.com/SoftFever/OrcaSlicer/releases/download/v$ORCASLICER_VERSION/OrcaSlicer_Linux_AppImage_V$ORCASLICER_VERSION.AppImage"
RUN chmod +x orca.AppImage
RUN ./orca.AppImage --appimage-extract
RUN rm orca.AppImage

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:22-bookworm-slim

RUN apt-get update \
	&& apt-get upgrade -y \
	&& apt-get install -y --no-install-recommends \
		curl ca-certificates \
        libgl1 libgl1-mesa-dri libegl1 \
        libgtk-3-0 \
        libgstreamer1.0-0 libgstreamer-plugins-base1.0-0 \
        libwebkit2gtk-4.0-37 \
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

CMD ["node", "app/dist/index.js"]