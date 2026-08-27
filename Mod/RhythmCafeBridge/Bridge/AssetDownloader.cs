using System;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

namespace RhythmCafeBridge.Bridge;

internal sealed class DownloadResult
{
    public bool Success { get; set; }
    public string Path { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

internal static class AssetDownloader
{
    public static async Task<DownloadResult> DownloadAsync(
        string url,
        string targetDirectory,
        string fileName,
        long maxBytes,
        Action<long, long>? onProgress,
        CancellationToken cancellationToken)
    {
        var targetPath = Path.Combine(targetDirectory, fileName);
        var temporaryPath = targetPath + ".part";

        try
        {
            Directory.CreateDirectory(targetDirectory);
            DeleteIfExists(temporaryPath);

            using var client = new HttpClient
            {
                Timeout = TimeSpan.FromMinutes(5),
            };
            client.DefaultRequestHeaders.UserAgent.ParseAdd("RhythmCafeBridge/0.1");

            using var response = await client.GetAsync(
                new Uri(url, UriKind.Absolute),
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                return Failure($"下载服务器返回 HTTP {(int)response.StatusCode}。");
            }

            var total = response.Content.Headers.ContentLength ?? -1L;
            if (total > maxBytes)
            {
                return Failure($"谱面文件超过 {maxBytes / 1024 / 1024} MiB 限制。");
            }

            using var input = await response.Content.ReadAsStreamAsync().ConfigureAwait(false);
            var buffer = new byte[81920];
            long loaded = 0;
            var exceededLimit = false;
            onProgress?.Invoke(0, total);

            using (var output = new FileStream(
                       temporaryPath,
                       FileMode.Create,
                       FileAccess.Write,
                       FileShare.None,
                       81920,
                       useAsync: true))
            {
                while (true)
                {
                    var read = await input.ReadAsync(buffer, 0, buffer.Length, cancellationToken).ConfigureAwait(false);
                    if (read <= 0) break;

                    loaded += read;
                    if (loaded > maxBytes)
                    {
                        exceededLimit = true;
                        break;
                    }

                    await output.WriteAsync(buffer, 0, read, cancellationToken).ConfigureAwait(false);
                    onProgress?.Invoke(loaded, total);
                }

                if (!exceededLimit)
                {
                    await output.FlushAsync(cancellationToken).ConfigureAwait(false);
                }
            }

            if (exceededLimit)
            {
                return Failure($"谱面文件超过 {maxBytes / 1024 / 1024} MiB 限制。");
            }

            DeleteIfExists(targetPath);
            File.Move(temporaryPath, targetPath);

            return new DownloadResult
            {
                Success = true,
                Path = targetPath,
                Message = "下载完成。",
            };
        }
        catch (OperationCanceledException)
        {
            DeleteIfExists(temporaryPath);
            return Failure("下载已取消。");
        }
        catch (Exception ex)
        {
            DeleteIfExists(temporaryPath);
            return Failure(ex.Message);
        }

        DownloadResult Failure(string message)
        {
            DeleteIfExists(temporaryPath);
            return new DownloadResult
            {
                Success = false,
                Message = message,
            };
        }
    }

    private static void DeleteIfExists(string path)
    {
        try
        {
            if (File.Exists(path)) File.Delete(path);
        }
        catch
        {
            // Cleanup is best-effort.
        }
    }
}
