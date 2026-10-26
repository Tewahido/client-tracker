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

WWW=/var/www
LIVE="$WWW/lendly"
NEW="$WWW/lendly.new"
OLD="$WWW/lendly.old"

# With a forced command, SSH puts what the client asked for in SSH_ORIGINAL_COMMAND.
request="${SSH_ORIGINAL_COMMAND:-lendly-receive ${1:-}}"
action=$(printf '%s' "$request" | awk '{ print $2 }')

case "$action" in
  "")
    rm -rf "$NEW"
    mkdir "$NEW"
    tar -C "$NEW" -xf -
    if [ ! -f "$NEW/index.html" ]; then
      rm -rf "$NEW"
      echo "lendly-receive: the upload has no index.html; nothing changed" >&2
      exit 1
    fi
    rm -rf "$OLD"
    if [ -d "$LIVE" ]; then mv "$LIVE" "$OLD"; fi
    mv "$NEW" "$LIVE"
    # The caller compares this with the index.html it built.
    sha256sum "$LIVE/index.html" | cut -d ' ' -f 1
    ;;
  rollback)
    if [ ! -d "$OLD" ]; then
      echo "lendly-receive: there is no previous version to go back to" >&2
      exit 1
    fi
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
