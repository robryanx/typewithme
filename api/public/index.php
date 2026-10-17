<?php declare(strict_types=1);

// A JSON API must never print warnings: xdebug-style traces would expose
// request headers (including the OpenAI authorization header) to clients.
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
require dirname(__DIR__, 2) . '/vendor/autoload.php';

function sendJson(mixed $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if ($path === '/api/health' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    sendJson(['ok' => true]);
}

if ($path === '/api/transcribe' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $environment = Environment::load(dirname(__DIR__, 2) . '/.env');
    } catch (Throwable $exception) {
        error_log((string) $exception);
        sendJson(['error' => 'Transcription is not configured. Ask Rob to add the OpenAI key.'], 503);
    }
    $apiKey = trim($environment['OPENAI_API_KEY'] ?? '');
    $model = trim($environment['OPENAI_TRANSCRIBE_MODEL'] ?? '') ?: 'gpt-transcribe';
    if ($apiKey === '' || str_starts_with($apiKey, 'replace-')) {
        sendJson(['error' => 'Transcription is not configured. Ask Rob to add the OpenAI key.'], 503);
    }

    try {
        $client = new OpenAiTranscriptionClient($apiKey, $model);
        sendJson((new Transcriber($client))->transcribeUpload($_FILES['audio'] ?? null));
    } catch (DomainException $exception) {
        sendJson(['error' => $exception->getMessage()], $exception->getCode() >= 400 ? $exception->getCode() : 500);
    } catch (Throwable $exception) {
        error_log((string) $exception);
        sendJson(['error' => 'The transcription service is temporarily unavailable.'], 500);
    }
}

sendJson(['error' => 'Route not found.'], 404);
