# DentNow backend image — Python 3.12, gunicorn + gevent.
#
# Multi-stage: a builder installs the vendored qf wheel + hash-lockable requirements
# into a venv; the runtime stage copies the venv and the backend source (including the
# packaged seeds/assets bundle the one-shot seed needs). Runs as a non-root user.
# Task 20 hardens this further (OCI labels, read-only rootfs); the build here is the
# same image used by the migrate/seed/api compose services.

# ---------- builder ----------
FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Build deps for psycopg2/Pillow/gevent native wheels (kept out of runtime image).
RUN apt-get update && apt-get install --no-install-recommends -y \
        build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /build
COPY dist/ ./dist/
COPY requirements.txt ./
# Verify the vendored wheel checksum before installing anything from it.
RUN cd dist && sha256sum --check SHA256SUMS
RUN pip install ./dist/qf-1.0.5-py3-none-any.whl -r requirements.txt

# ---------- runtime ----------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH=/app

# libpq for psycopg2 at runtime; curl for container healthcheck.
RUN apt-get update && apt-get install --no-install-recommends -y \
        libpq5 curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 dentnow

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
# Backend runtime files. seeds/assets is packaged so the one-shot seed never needs a
# frontend bind mount or sibling build context.
COPY --chown=dentnow:dentnow . /app

USER dentnow
EXPOSE 5100

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD curl -fsS "http://127.0.0.1:${API_PORT:-5100}/api/liveness" || exit 1

CMD ["gunicorn", "-c", "gunicorn.conf.py", "wsgi:app"]
