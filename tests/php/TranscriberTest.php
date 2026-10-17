<?php declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class TranscriberTest extends TestCase
{
    public function testTranscribesAValidUpload(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'twm');
        file_put_contents((string) $path, 'fake-audio-bytes');
        $transcribed = null;
        $client = new OpenAiTranscriptionClient('test-key', 'gpt-transcribe', function (string $method, string $url, array $headers, string $body) use (&$transcribed): array {
            $transcribed = ['body' => $body];

            return ['status' => 200, 'body' => '{"text":"say hi"}'];
        });

        $result = (new Transcriber($client))->transcribeUpload([
            'tmp_name' => $path,
            'name' => 'my recording!.webm',
            'size' => filesize($path),
            'error' => UPLOAD_ERR_OK,
        ]);

        self::assertSame(['text' => 'say hi'], $result);
        self::assertStringContainsString('name="file"; filename="myrecording.webm"', $transcribed['body']);
        unlink((string) $path);
    }

    public function testRejectsAMissingUpload(): void
    {
        $client = new OpenAiTranscriptionClient('test-key', 'gpt-transcribe', static fn(): array => ['status' => 200, 'body' => '{}']);
        $this->expectException(DomainException::class);
        $this->expectExceptionCode(422);
        (new Transcriber($client))->transcribeUpload(null);
    }

    public function testRejectsAFailedUpload(): void
    {
        $client = new OpenAiTranscriptionClient('test-key', 'gpt-transcribe', static fn(): array => ['status' => 200, 'body' => '{}']);
        $this->expectException(DomainException::class);
        $this->expectExceptionCode(422);
        (new Transcriber($client))->transcribeUpload(['tmp_name' => '/tmp/x', 'name' => 'a.webm', 'size' => 5, 'error' => UPLOAD_ERR_PARTIAL]);
    }

    public function testRejectsAnOversizedUpload(): void
    {
        $client = new OpenAiTranscriptionClient('test-key', 'gpt-transcribe', static fn(): array => ['status' => 200, 'body' => '{}']);
        $this->expectException(DomainException::class);
        $this->expectExceptionCode(422);
        (new Transcriber($client))->transcribeUpload(['tmp_name' => '/tmp/x', 'name' => 'a.webm', 'size' => Transcriber::MAX_BYTES + 1, 'error' => UPLOAD_ERR_OK]);
    }
}
