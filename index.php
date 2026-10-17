<?php declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

// Nginx serves this site under /typewithme/. Strip that prefix so the API
// front controller routes on the same paths as the local dev router.
$prefix = '/typewithme';
if (str_starts_with($path, $prefix . '/api/')) {
    $_SERVER['REQUEST_URI'] = substr($_SERVER['REQUEST_URI'], strlen($prefix));
    require __DIR__ . '/api/public/index.php';
    exit;
}

if (str_starts_with($path, '/api/')) {
    require __DIR__ . '/api/public/index.php';
    exit;
}

$index = __DIR__ . '/dist/index.html';
if (!is_file($index)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo "The frontend has not been built. Run: bun run build\n";
    exit;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache');
readfile($index);
