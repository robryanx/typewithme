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
        $filename = preg_replace('/[^A-Za-z0-9._-]/', '', (string) ($upload['name'] ?? 'speech.webm'));
        if (!is_string($filename) || $filename === '') {
            $filename = 'speech.webm';
        }

        return ['text' => $this->client->transcribe($audio, $filename)];
    }
}
