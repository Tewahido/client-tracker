#!/bin/sh
# Server side of a deploy: installed as /usr/local/bin/lendly-receive and run over SSH as
# the deploy user (scripts/deploy.mjs calls it). The GitHub Actions key is forced to run
# only this script (see "Deploying" in README.md), so it can deploy or roll back, nothing else.
#
#   lendly-receive            unpack a build (a tar stream on stdin) and make it live
#   lendly-receive rollback   put the previous version back
#
# The new build is unpacked beside the live one and swapped in with renames, so visitors
# never see half-uploaded files. The previous version is kept as lendly.old.
set -eu

# LENDLY_WWW is for tests (deploy/lendly-receive.test.mjs); on the server it is /var/www.
WWW="${LENDLY_WWW:-/var/www}"
LIVE="$WWW/lendly"
NEW="$WWW/lendly.new"
OLD="$WWW/lendly.old"
# A build is about 2 MB; anything near this is a mistake or an attack on the disk.
MAX_BYTES=104857600
MAX_SECONDS=300

# One deploy or rollback at a time (the CI and someone's PC could overlap).
exec 9>"$WWW/.lendly-receive.lock"
if ! flock -n 9; then
  echo "lendly-receive: another deploy is running; try again shortly" >&2
  exit 1
fi

# With a forced command, SSH puts what the client asked for in SSH_ORIGINAL_COMMAND.
request="${SSH_ORIGINAL_COMMAND:-lendly-receive ${1:-}}"
action=$(printf '%s' "$request" | awk '{ print $2 }')

reject() {
  rm -rf "$NEW"
  echo "lendly-receive: $1; nothing changed" >&2
  exit 1
}

case "$action" in
  "")
    rm -rf "$NEW"
    mkdir "$NEW"
    # Bounded in size and time. Ownership and permissions come from this server, not the upload.
    timeout "$MAX_SECONDS" head -c "$MAX_BYTES" | tar --no-same-owner --no-same-permissions -C "$NEW" -xf - ||
      reject "the upload couldn't be unpacked (too large, too slow, or not a tar archive)"
    if [ "$(du -sb "$NEW" | cut -f 1)" -ge "$MAX_BYTES" ]; then reject "the upload is too large"; fi
    # Only plain files and folders: a symlink could make the web server publish other files
    # on this machine (such as its HTTPS private key).
    if [ -n "$(find "$NEW" ! -type f ! -type d -print -quit)" ]; then reject "links and special files aren't allowed"; fi
    if [ ! -f "$NEW/index.html" ]; then reject "the upload has no index.html"; fi
    rm -rf "$OLD"
    if [ -d "$LIVE" ]; then mv "$LIVE" "$OLD"; fi
    mv "$NEW" "$LIVE"
    # The caller compares this with the index.html it built.
    sha256sum "$LIVE/index.html" | cut -d ' ' -f 1
    ;;
  rollback)
    if [ ! -d "$OLD" ] || [ ! -d "$LIVE" ]; then
      echo "lendly-receive: there is no previous version to go back to" >&2
      exit 1
    fi
    # Swaps live and previous: rolling back twice returns to the newer version.
    rm -rf "$NEW"
    mv "$LIVE" "$NEW"
    mv "$OLD" "$LIVE"
    mv "$NEW" "$OLD"
    echo "rolled back; the version you left is kept as lendly.old"
    ;;
  *)
    echo "lendly-receive: unknown command '$action' (use no argument or 'rollback')" >&2
    exit 2
    ;;
esac
