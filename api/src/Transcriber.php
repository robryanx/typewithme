<?php declare(strict_types=1);

/**
 * Application-level transcription service: validates the uploaded recording
 * and delegates to the OpenAI client.
 */
final class Transcriber
{
    public const MAX_BYTES = 26_214_400;  // 25 MiB, matching OpenAI's own file cap.

    public function __construct(
        private readonly OpenAiTranscriptionClient $client
    ) {}

    /**
     * @param array<string, mixed>|null $upload One entry from $_FILES.
     * @return array{text: string}
     */
    public function transcribeUpload(?array $upload): array
    {
        if ($upload === null || !is_string($upload['tmp_name'] ?? null) || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new DomainException('An audio recording is required.', 422);
        }
        $size = (int) ($upload['size'] ?? 0);
        if ($size <= 0 || $size > self::MAX_BYTES) {
            throw new DomainException('The recording must be between 1 byte and 25 MB.', 422);
        }
        $tmpName = (string) $upload['tmp_name'];
        $audio = file_get_contents($tmpName);
        if ($audio === false) {
            throw new DomainException('The recording could not be read.', 422);
        }

        return ['text' => $this->client->transcribe($audio, self::filenameFor($audio, (string) ($upload['name'] ?? '')))];
    }

    /**
     * OpenAI dispatches on the file extension, so it must match the actual
     * container. Browsers do not always agree with themselves: Firefox records
     * OGG/Opus even when asked for webm, and names lie. Sniff the magic bytes
     * first and fall back to the sanitised upload name.
     */
    public static function filenameFor(string $audio, string $fallbackName): string
    {
        $sniffed = match (substr($audio, 0, 4)) {
            'OggS' => 'ogg',
            "\x1aEߣ" => 'webm',  // EBML header shared by WebM/Matroska.
            'RIFF' => str_starts_with(substr($audio, 8, 4), 'WAVE') ? 'wav' : null,
            'fLaC' => 'flac',
            default => null,
        };
        if ($sniffed !== null) {
            return "speech.{$sniffed}";
        }
        if (str_starts_with($audio, 'ID3') || (strlen($audio) > 2 && $audio[0] === "\xff" && ((ord($audio[1]) & 0xE0) === 0xE0))) {
            return 'speech.mp3';
        }
        if (substr($audio, 4, 4) === 'ftyp') {
            return 'speech.m4a';
        }
        $fallback = preg_replace('/[^A-Za-z0-9._-]/', '', $fallbackName);
        return is_string($fallback) && $fallback !== '' ? $fallback : 'speech.webm';
    }
}
