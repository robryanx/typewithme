<?php declare(strict_types=1);

/**
 * Sends recorded audio to OpenAI's transcription endpoint and returns the
 * transcript text. The multipart body is built by hand so the HTTP transport
 * is a plain callable that tests can fake.
 */
final class OpenAiTranscriptionClient
{
    public const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';

    // These are chat messages for online games: kids dictate one short line
    // and punctuation only means extra characters to type. The prompt is the
    // only style lever OpenAI gives us, so spell the rules out explicitly.
    public const STYLE_PROMPT = 'Kids are dictating short chat messages to send in online games like Roblox or Minecraft. '
        . 'Transcribe exactly the words they say. Add no punctuation at all: no commas, no full stops, no question marks, '
        . 'no exclamation marks, no colons, no emojis. The only exception: if the recording clearly contains several '
        . 'separate sentences, separate those sentences with full stops and add no other punctuation.';

    /** @var callable(string, string, array<string, string>, string): array{status: int, body: string} */
    private $transport;

    /**
     * @param callable(string, string, array<string, string>, string): array{status: int, body: string}|null $transport
     *        Accepts ($method, $url, $headers, $body) and returns status + raw body.
     */
    public function __construct(
        private readonly string $apiKey,
        private readonly string $model,
        ?callable $transport = null
    ) {
        $this->transport = $transport ?? static fn(string $method, string $url, array $headers, string $body): array => self::defaultTransport($method, $url, $headers, $body);
    }

    public function transcribe(string $audio, string $filename): string
    {
        if ($audio === '') {
            throw new DomainException('The recording is empty.', 422);
        }

        $boundary = 'typewithme-' . bin2hex(random_bytes(16));
        $body = $this->buildMultipart($boundary, $filename, $audio, self::STYLE_PROMPT);
        $result = ($this->transport)(
            'POST',
            self::ENDPOINT,
            [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'multipart/form-data; boundary=' . $boundary,
            ],
            $body,
        );

        if ($result['status'] >= 400) {
            // Log the upstream failure for diagnosis; the body carries no secrets.
            error_log('OpenAI transcription failed (HTTP ' . $result['status'] . '): ' . substr($result['body'], 0, 500));
            throw new DomainException('Transcription failed (HTTP ' . $result['status'] . ').', 500);
        }

        $decoded = json_decode($result['body'], true);
        $text = is_array($decoded) && isset($decoded['text']) && is_string($decoded['text']) ? trim($decoded['text']) : '';
        if ($text === '') {
            // 422 so Cloudflare passes our message through untouched (it
            // replaces 502/504 responses with its own error page).
            throw new DomainException('I could not hear any words in that recording — try again a little louder and closer to the mic.', 422);
        }

        return $text;
    }

    private function buildMultipart(string $boundary, string $filename, string $audio, string $prompt): string
    {
        // temperature 0 keeps the transcription literal instead of creative.
        $fields = ['model' => $this->model, 'response_format' => 'json', 'prompt' => $prompt, 'temperature' => '0'];
        $parts = [];
        foreach ($fields as $name => $value) {
            $parts[] = "--{$boundary}\r\nContent-Disposition: form-data; name=\"{$name}\"\r\n\r\n{$value}\r\n";
        }
        $parts[] = "--{$boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{$filename}\"\r\n"
            . "Content-Type: application/octet-stream\r\n\r\n{$audio}\r\n";
        $parts[] = "--{$boundary}--\r\n";

        return implode('', $parts);
    }

    private static function defaultTransport(string $method, string $url, array $headers, string $body): array
    {
        $headerLines = [];
        foreach ($headers as $name => $value) {
            $headerLines[] = $name . ': ' . $value;
        }
        $handle = curl_init($url);
        if ($handle === false) {
            throw new RuntimeException('Unable to initialise the transcription request.');
        }
        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headerLines,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60,
        ]);
        $response = curl_exec($handle);
        if (!is_string($response)) {
            $error = curl_error($handle);
            throw new DomainException('Could not reach the transcription service: ' . $error, 500);
        }
        $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);

        return ['status' => $status, 'body' => $response];
    }
}
