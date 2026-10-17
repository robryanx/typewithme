<?php declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

// Locally the site is served from the root; in production nginx mounts it
// under /typewithme/. Normalise so one router handles both.
if ($path === '/typewithme' || str_starts_with($path, '/typewithme/')) {
    $path = substr($path, strlen('/typewithme')) ?: '/';
}

// Keep API requests inside PHP. Everything else is the compiled React app.
if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/public/index.php';
    return true;
}

$distRoot = dirname(__DIR__) . '/dist';
$assetPath = str_starts_with($path, '/dist/') ? substr($path, 5) : $path;
$candidate = realpath($distRoot . $assetPath);

if ($path !== '/' && $candidate !== false && str_starts_with($candidate, realpath($distRoot)) && is_file($candidate)) {
    $types = [
        'css' => 'text/css; charset=utf-8',
        'js' => 'text/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        'woff2' => 'font/woff2',
    ];
    $extension = strtolower(pathinfo($candidate, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($types[$extension] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($candidate));
    header('Cache-Control: public, max-age=31536000, immutable');
    readfile($candidate);
    return true;
}

$index = $distRoot . '/index.html';
if (!is_file($index)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo "The React build is missing. Run: bun run build\n";
    return true;
}

header('Content-Type: text/html; charset=utf-8');
header('Content-Length: ' . filesize($index));
header('Cache-Control: no-cache');
readfile($index);
return true;
