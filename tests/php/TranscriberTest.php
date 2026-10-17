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

    public function testFilenameSniffsContainersFromMagicBytes(): void
    {
        // Firefox records OGG/Opus, however the upload is named.
        self::assertSame('speech.ogg', Transcriber::filenameFor("OggS\0\x02data", 'speech.webm'));
        self::assertSame('speech.webm', Transcriber::filenameFor("\x1aEߣwebm-data", 'speech.ogg'));
        self::assertSame('speech.wav', Transcriber::filenameFor("RIFF\0\0\0\0WAVEfmt ", 'x.mystery'));
        self::assertSame('speech.flac', Transcriber::filenameFor('fLaC-blocks', 'x.mystery'));
        self::assertSame('speech.mp3', Transcriber::filenameFor('ID3 tags and frames', 'x.mystery'));
        self::assertSame('speech.m4a', Transcriber::filenameFor("\0\0\0 ftypM4A ", 'x.mystery'));
        // Nothing recognisable: trust the sanitised upload name.
        self::assertSame('take5.mp3', Transcriber::filenameFor('random-bytes', 'take 5!.mp3'));
        self::assertSame('speech.webm', Transcriber::filenameFor('random-bytes', ''));
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
