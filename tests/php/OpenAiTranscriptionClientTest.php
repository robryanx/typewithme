<?php declare(strict_types=1);

use PHPUnit\Framework\TestCase;

final class OpenAiTranscriptionClientTest extends TestCase
{
    public function testTranscribeSendsMultipartRequestAndReturnsText(): void
    {
        $captured = null;
        $client = new OpenAiTranscriptionClient('test-key', 'gpt-transcribe', function (string $method, string $url, array $headers, string $body) use (&$captured): array {
            $captured = compact('method', 'url', 'headers', 'body');

            return ['status' => 200, 'body' => json_encode(['text' => '  hello game world '])];
        });

        $text = $client->transcribe('RIFF-fake-audio', 'speech.webm');

        self::assertSame('hello game world', $text);
        self::assertSame('POST', $captured['method']);
        self::assertSame(OpenAiTranscriptionClient::ENDPOINT, $captured['url']);
        self::assertSame('Bearer test-key', $captured['headers']['Authorization']);
        self::assertStringContainsString('multipart/form-data; boundary=', $captured['headers']['Content-Type']);
        self::assertStringContainsString('name="model"', $captured['body']);
        self::assertStringContainsString('gpt-transcribe', $captured['body']);
        // Chat-message style instruction travels with every request.
        self::assertStringContainsString('name="prompt"', $captured['body']);
        self::assertStringContainsString('no punctuation unless', $captured['body']);
        self::assertStringContainsString('name="file"; filename="speech.webm"', $captured['body']);
        self::assertStringContainsString('RIFF-fake-audio', $captured['body']);
    }

    public function testTranscribeRejectsEmptyAudio(): void
    {
        $client = new OpenAiTranscriptionClient('test-key', 'gpt-transcribe', static fn(): array => ['status' => 200, 'body' => '{"text":"x"}']);
        $this->expectException(DomainException::class);
        $this->expectExceptionCode(422);
        $client->transcribe('', 'speech.webm');
    }

    public function testTranscribeMapsUpstreamFailureToServerError(): void
    {
        $client = new OpenAiTranscriptionClient('test-key', 'gpt-transcribe', static fn(): array => ['status' => 401, 'body' => '{"error":"bad key"}']);
        $this->expectException(DomainException::class);
        $this->expectExceptionCode(500);
        $client->transcribe('audio', 'speech.webm');
    }

    public function testTranscribeRejectsResponsesWithoutText(): void
    {
        $client = new OpenAiTranscriptionClient('test-key', 'gpt-transcribe', static fn(): array => ['status' => 200, 'body' => '{"unexpected":true}']);
        $this->expectException(DomainException::class);
        // 422, not 502: Cloudflare replaces origin 502/504 responses with its
        // own error page, which would hide the kid-friendly message.
        $this->expectExceptionCode(422);
        $client->transcribe('audio', 'speech.webm');
    }
}
