FROM hayd/deno:debian-1.6.2

# Update default packages
RUN apt update

# Install required libs
RUN apt install -y curl git build-essential libasound2-dev libgtk-3-dev libssl-dev ffmpeg kid3-cli

# Install rust & cargo
RUN curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Build & install SongRec from source
WORKDIR /usr/src/songrec
RUN git clone https://github.com/marin-m/songrec .
RUN cargo install --path .

# Song-Recognition
WORKDIR /usr/src/app
COPY src/deps.ts .
RUN deno cache deps.ts --unstable
ADD src/ .
RUN deno cache main.ts --unstable

# Expose port
EXPOSE 3000

# Run application
CMD ["run", "--allow-net", "--allow-run", "--allow-read", "--allow-write", "--unstable", "main.ts"]
