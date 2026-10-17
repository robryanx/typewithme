#!/usr/bin/env bash
set -euo pipefail

# Wires typewithme into the existing robserver.me HTTPS server block:
# - copies the location blocks to /etc/nginx/typewithme.conf
# - adds one include line to /var/www/vhosts/servers.conf (with a backup)
# - grants the nginx user (http) traversal into /home/rob/typewithme
#
# Run as root: sudo ./ops/install-nginx-site.sh

if [[ ${EUID} -ne 0 ]]; then
    echo "Run this installer as root: sudo $0" >&2
    exit 1
fi

repo=/home/rob/typewithme
site_source="$repo/ops/nginx/robserver.me-typewithme.conf"
site_target=/etc/nginx/typewithme.conf
managed_vhosts=/var/www/vhosts/servers.conf
include_line="include /etc/nginx/typewithme.conf;"

install -m 0644 "$site_source" "$site_target"

if ! grep -Fq "$include_line" "$managed_vhosts"; then
    cp -a "$managed_vhosts" "${managed_vhosts}.bak.$(date +%Y%m%d%H%M%S)"
    # Anchor on the unique comment inside the robserver.me HTTPS block.
    sed -i '\|# Root intentionally blank: Jellyfin moved to robmedia.fyi|a\    '"$include_line" "$managed_vhosts"
fi

# Nginx runs as `http`; grant traversal without opening Rob's home to everyone.
setfacl -m u:http:x /home/rob
setfacl -m u:http:rx "$repo"

nginx -t
systemctl reload nginx

echo "Installed: https://robserver.me/typewithme"
echo "Remember to build the frontend first: bun run build (in $repo)."
