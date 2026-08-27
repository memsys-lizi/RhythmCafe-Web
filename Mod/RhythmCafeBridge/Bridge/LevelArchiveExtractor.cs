using System;
using System.IO;
using System.IO.Compression;
using System.Linq;

namespace RhythmCafeBridge.Bridge;

internal sealed class ExtractionResult
{
    public bool Success { get; set; }
    public string Path { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

internal static class LevelArchiveExtractor
{
    public static ExtractionResult Extract(string archivePath, string levelId, string levelsRoot)
    {
        var stagingDirectory = Path.Combine(levelsRoot, $"RhythmCafe_{levelId}.staging_{Guid.NewGuid():N}");

        try
        {
            Directory.CreateDirectory(levelsRoot);
            Directory.CreateDirectory(stagingDirectory);

            using (var archive = ZipFile.OpenRead(archivePath))
            {
                var stagingRoot = EnsureTrailingSeparator(Path.GetFullPath(stagingDirectory));
                foreach (var entry in archive.Entries)
                {
                    var relativePath = entry.FullName.Replace('\\', '/');
                    if (string.IsNullOrWhiteSpace(relativePath)) continue;

                    var parts = relativePath.Split('/');
                    if (Path.IsPathRooted(relativePath) || parts.Any(part => part == ".."))
                    {
                        return Failure(stagingDirectory, "压缩包包含不安全的文件路径。");
                    }

                    var destinationPath = Path.GetFullPath(Path.Combine(stagingDirectory, relativePath));
                    if (!destinationPath.StartsWith(stagingRoot, StringComparison.OrdinalIgnoreCase))
                    {
                        return Failure(stagingDirectory, "压缩包包含越界文件路径。");
                    }

                    if (string.IsNullOrEmpty(entry.Name))
                    {
                        Directory.CreateDirectory(destinationPath);
                        continue;
                    }

                    var parent = Path.GetDirectoryName(destinationPath);
                    if (!string.IsNullOrEmpty(parent)) Directory.CreateDirectory(parent);
                    entry.ExtractToFile(destinationPath, overwrite: true);
                }
            }

            var levelFiles = Directory.GetFiles(stagingDirectory, "*.rdlevel", SearchOption.AllDirectories);
            var levelPath = levelFiles.FirstOrDefault(path =>
                Path.GetFileName(path).Equals("main.rdlevel", StringComparison.OrdinalIgnoreCase));
            levelPath ??= levelFiles.FirstOrDefault(path =>
                !Path.GetFileName(path).Equals("backup.rdlevel", StringComparison.OrdinalIgnoreCase));

            if (string.IsNullOrEmpty(levelPath))
            {
                return Failure(stagingDirectory, "压缩包中没有找到 .rdlevel 谱面文件。");
            }

            File.WriteAllText(Path.Combine(stagingDirectory, ".rhythmcafe"), levelId);

            var targetDirectory = GetTargetDirectory(levelsRoot, levelId);
            if (Directory.Exists(targetDirectory))
            {
                Directory.Delete(targetDirectory, recursive: true);
            }

            Directory.Move(stagingDirectory, targetDirectory);
            var relativeLevelPath = GetRelativePath(stagingDirectory, levelPath);
            return new ExtractionResult
            {
                Success = true,
                Path = Path.Combine(targetDirectory, relativeLevelPath),
                Message = "谱面解压完成。",
            };
        }
        catch (InvalidDataException)
        {
            return Failure(stagingDirectory, "下载的文件不是有效的 ZIP 谱面包。");
        }
        catch (Exception ex)
        {
            return Failure(stagingDirectory, ex.Message);
        }
    }

    private static string GetTargetDirectory(string levelsRoot, string levelId)
    {
        var baseDirectory = Path.Combine(levelsRoot, $"RhythmCafe_{levelId}");
        if (!Directory.Exists(baseDirectory)) return baseDirectory;

        var markerPath = Path.Combine(baseDirectory, ".rhythmcafe");
        if (File.Exists(markerPath)
            && File.ReadAllText(markerPath).Trim().Equals(levelId, StringComparison.Ordinal))
        {
            return baseDirectory;
        }

        for (var index = 1; ; index++)
        {
            var candidate = $"{baseDirectory}_{index}";
            if (!Directory.Exists(candidate)) return candidate;
        }
    }

    private static ExtractionResult Failure(string stagingDirectory, string message)
    {
        try
        {
            if (Directory.Exists(stagingDirectory)) Directory.Delete(stagingDirectory, recursive: true);
        }
        catch
        {
            // Cleanup is best-effort.
        }

        return new ExtractionResult
        {
            Success = false,
            Message = message,
        };
    }

    private static string EnsureTrailingSeparator(string path)
    {
        return path.EndsWith(Path.DirectorySeparatorChar.ToString(), StringComparison.Ordinal)
            ? path
            : path + Path.DirectorySeparatorChar;
    }

    private static string GetRelativePath(string root, string path)
    {
        var rootUri = new Uri(EnsureTrailingSeparator(Path.GetFullPath(root)), UriKind.Absolute);
        var pathUri = new Uri(Path.GetFullPath(path), UriKind.Absolute);
        return Uri.UnescapeDataString(rootUri.MakeRelativeUri(pathUri).ToString())
            .Replace('/', Path.DirectorySeparatorChar);
    }
}
