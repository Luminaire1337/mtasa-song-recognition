# Use hardcoded Deno & Ubuntu versions for reproducibility
FROM ubuntu:24.04
COPY --from=denoland/deno:bin-2.3.5 /deno /usr/local/bin/deno

# Install dependencies
# Use noninteractive mode to avoid prompts during package installation
ARG DEBIAN_FRONTEND=noninteractive
RUN apt update && apt -y upgrade \
	&& apt -y install ffmpeg software-properties-common \
    && add-apt-repository ppa:marin-m/songrec -y -u \
    && apt -y install songrec \
	&& rm -rf /var/lib/apt/lists/*

# Set default permissions
ARG DEFAULT_PERMISSIONS=755

# Use built-in user from Ubuntu image
ARG USER_NAME=ubuntu
ARG GROUP_NAME=${USER_NAME}

# Set the working directory
WORKDIR /usr/src/app

# Create volumes & modify working directory permissions
RUN mkdir -p /usr/src/resources \
    && chown -R ${USER_NAME}:${GROUP_NAME} /usr/src \
    && chmod -R ${DEFAULT_PERMISSIONS} /usr/src

# Copy the source code
ADD --chown=${USER_NAME}:${GROUP_NAME} --chmod=${DEFAULT_PERMISSIONS} . .

# Change user to non-root
USER ${USER_NAME}

# Cache dependencies
RUN deno cache src/main.ts

# Expose the port
EXPOSE 3000

# Volumes
VOLUME ["/usr/src/resources"]

# Run the application
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--allow-run=ffmpeg,ffprobe,songrec", "src/main.ts"]