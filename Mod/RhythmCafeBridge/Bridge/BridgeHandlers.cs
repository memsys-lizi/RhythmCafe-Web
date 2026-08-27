using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace RhythmCafeBridge.Bridge;

internal sealed class BridgeHandlers
{
    private readonly Settings _settings;
    private readonly BridgeRequestQueue _queue;
    private readonly SseEventHub _events;
    private int _busy;

    public BridgeHandlers(Settings settings, BridgeRequestQueue queue, SseEventHub events)
    {
        _settings = settings;
        _queue = queue;
        _events = events;
    }

    public bool IsBusy => Volatile.Read(ref _busy) == 1;

    public HealthResponse BuildHealth(int port)
    {
        var scene = string.Empty;
        try
        {
            scene = SceneManager.GetActiveScene().name ?? string.Empty;
        }
        catch
        {
            // Unity may still be loading its first scene.
        }

        return new HealthResponse
        {
            connected = true,
            modVersion = Main.PLUGIN_VERSION,
            port = port,
            scene = scene,
            gameReady = Application.isPlaying && !string.IsNullOrEmpty(scene),
            busy = IsBusy,
        };
    }

    public async Task<BridgeHttpResult> HandleOpenLevelAsync(string body)
    {
        if (!BridgeJson.TryDeserialize(body, out OpenLevelRequest? request) || request == null)
        {
            return BridgeHttpResult.BadRequest("INVALID_REQUEST", "请求格式无效。");
        }

        if (!IsValidLevelId(request.levelId))
        {
            return BridgeHttpResult.BadRequest("INVALID_REQUEST", "关卡 ID 无效。");
        }

        if (!TryValidateFileName(request.fileName, out var archiveExtension))
        {
            return BridgeHttpResult.BadRequest("INVALID_FILE_NAME", "谱面文件名无效，只支持 .rdzip 或 .zip 文件。");
        }

        if (!TryValidateDownloadUrl(request.downloadUrl, out var downloadUri))
        {
            return BridgeHttpResult.BadRequest("DOWNLOAD_URL_NOT_ALLOWED", "下载地址不在允许范围内。");
        }

        if (Interlocked.CompareExchange(ref _busy, 1, 0) != 0)
        {
            return BridgeHttpResult.Conflict("BUSY", "已有谱面正在下载或打开，请稍后重试。");
        }

        var requestId = Guid.NewGuid().ToString("N");
        PublishProgress(requestId, request.levelId, "preparing", 0, -1, "正在准备下载。");

        try
        {
            var levelDirectory = string.IsNullOrWhiteSpace(_settings.LevelDirectory.Value)
                ? Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                    "Rhythm Doctor",
                    "Levels")
                : _settings.LevelDirectory.Value;
            var tempDirectory = Path.Combine(levelDirectory, "..", "Temp", "RhythmCafeBridge");
            tempDirectory = Path.GetFullPath(tempDirectory);
            var archivePath = Path.Combine(tempDirectory, $"{request.levelId}{archiveExtension}");

            var download = await AssetDownloader.DownloadAsync(
                downloadUri.ToString(),
                tempDirectory,
                Path.GetFileName(archivePath),
                (long)_settings.MaxDownloadMiB.Value * 1024 * 1024,
                (loaded, total) => PublishProgress(
                    requestId,
                    request.levelId,
                    "downloading",
                    loaded,
                    total,
                    "正在下载谱面。"),
                CancellationToken.None).ConfigureAwait(false);

            if (!download.Success)
            {
                PublishProgress(requestId, request.levelId, "error", 0, -1, download.Message);
                return BridgeHttpResult.Error("DOWNLOAD_FAILED", $"谱面下载失败：{download.Message}", requestId);
            }

            try
            {
                PublishProgress(requestId, request.levelId, "extracting", 0, 1, "正在解压谱面。");
                var extracted = LevelArchiveExtractor.Extract(download.Path, request.levelId, levelDirectory);
                if (!extracted.Success)
                {
                    PublishProgress(requestId, request.levelId, "error", 0, -1, extracted.Message);
                    return BridgeHttpResult.Error("ARCHIVE_INVALID", $"谱面解压失败：{extracted.Message}", requestId);
                }

                PublishProgress(requestId, request.levelId, "opening", 1, 1, "正在进入游戏。");
                var opened = await _queue.Enqueue(() => OpenLevel(extracted.Path, request.levelId)).ConfigureAwait(false);
                opened.requestId = requestId;
                PublishProgress(
                    requestId,
                    request.levelId,
                    opened.success ? "success" : "error",
                    1,
                    1,
                    opened.message);

                return BridgeHttpResult.Ok(opened);
            }
            finally
            {
                DeleteIfExists(download.Path);
            }
        }
        catch (Exception ex)
        {
            Main.Instance?.Logger.LogError($"Opening level {request.levelId} failed: {ex}");
            PublishProgress(requestId, request.levelId, "error", 0, -1, "谱面打开失败，请查看游戏日志。");
            return BridgeHttpResult.Error("OPEN_FAILED", "谱面打开失败，请查看游戏日志。", requestId);
        }
        finally
        {
            Volatile.Write(ref _busy, 0);
        }
    }

    private BridgeResponse OpenLevel(string path, string levelId)
    {
        if (!File.Exists(path))
        {
            return BridgeResponse.Fail("LEVEL_FILE_NOT_FOUND", "解压后没有找到可打开的谱面文件。");
        }

        var scene = SceneManager.GetActiveScene().name;
        if (!Application.isPlaying || string.IsNullOrEmpty(scene))
        {
            return BridgeResponse.Fail("GAME_NOT_READY", "游戏场景尚未准备好，请稍后重试。");
        }

        scnBase.GoToLevelWithExternalPath(path);
        Main.Instance?.Logger.LogInfo($"Opening Rhythm Cafe level {levelId}: {path}");
        return BridgeResponse.Ok("谱面已下载，正在进入游戏。", "opening");
    }

    private bool TryValidateDownloadUrl(string value, out Uri uri)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out var parsed))
        {
            uri = null!;
            return false;
        }

        uri = parsed;

        if (uri.Scheme.Equals(Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
            && IsLoopbackHost(uri.Host))
        {
            return true;
        }

        if (!uri.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)) return false;

        var host = uri.Host;
        return _settings.GetAllowedDownloadHosts()
            .Any(allowedHost => host.Equals(allowedHost, StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsLoopbackHost(string host)
    {
        return host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
            || host.Equals("::1", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsValidLevelId(string value)
    {
        return !string.IsNullOrWhiteSpace(value)
            && value.Length <= 128
            && value.All(character => char.IsLetterOrDigit(character) || character is '_' or '-');
    }

    private static bool TryValidateFileName(string value, out string extension)
    {
        extension = string.Empty;
        if (string.IsNullOrWhiteSpace(value) || value.Length > 128)
        {
            return false;
        }

        var fileName = value.Trim();
        if (!fileName.Equals(Path.GetFileName(fileName), StringComparison.Ordinal))
        {
            return false;
        }

        var parsedExtension = Path.GetExtension(fileName);
        if (!parsedExtension.Equals(".rdzip", StringComparison.OrdinalIgnoreCase)
            && !parsedExtension.Equals(".zip", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        extension = parsedExtension.ToLowerInvariant();
        return true;
    }

    private void PublishProgress(string requestId, string levelId, string state, long loaded, long total, string message)
    {
        var percentage = total > 0
            ? (int)Math.Max(0, Math.Min(100, loaded * 100 / total))
            : -1;

        _events.Publish(
            "progress",
            requestId,
            BridgeJson.Serialize(new ProgressEvent
            {
                requestId = requestId,
                levelId = levelId,
                state = state,
                loaded = loaded,
                total = total,
                percentage = percentage,
                message = message,
            }));
    }

    private static void DeleteIfExists(string path)
    {
        try
        {
            if (File.Exists(path)) File.Delete(path);
        }
        catch (Exception ex)
        {
            Main.Instance?.Logger.LogWarning($"Could not remove temporary archive: {ex.Message}");
        }
    }
}
