<?php declare(strict_types=1);

final class Environment
{
    /**
     * @return array<string, string>
     */
    public static function load(string $path): array
    {
        if (!is_file($path) || !is_readable($path)) {
            throw new RuntimeException("Environment file is not readable: {$path}");
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            throw new RuntimeException("Environment file could not be read: {$path}");
        }

        // Tolerant dotenv parsing: keys stay verbatim, values keep any
        // characters OpenAI keys may contain, so no INI syntax surprises.
        $values = [];
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
                continue;
            }
            $separator = strpos($trimmed, '=');
            $key = trim(substr($trimmed, 0, $separator));
            $value = trim(substr($trimmed, $separator + 1));
            if (strlen($value) >= 2 && ($value[0] === '"' || $value[0] === "'") && $value[strlen($value) - 1] === $value[0]) {
                $value = substr($value, 1, -1);
            }
            if ($key !== '') {
                $values[$key] = $value;
            }
        }

        return $values;
    }
}
