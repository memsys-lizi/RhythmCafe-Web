using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace RhythmCafeBridge.Bridge;

internal sealed class LocalBridgeServer : IDisposable
{
    private readonly Settings _settings;
    private readonly BridgeRequestQueue _queue = new();
    private readonly SseEventHub _events = new();
    private readonly BridgeHandlers _handlers;
    private HttpListener? _listener;
    private Thread? _workerThread;
    private volatile bool _running;
    private HealthResponse _cachedHealth = new()
    {
        connected = true,
        modVersion = Main.PLUGIN_VERSION,
        port = 2771,
    };

    public LocalBridgeServer(Settings settings)
    {
        _settings = settings;
        _handlers = new BridgeHandlers(settings, _queue, _events);
    }

    public int Port => _settings.Port.Value;

    public bool Start()
    {
        if (_running) return true;

        try
        {
            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://127.0.0.1:{Port}/");
            _listener.Start();
            _running = true;

            _workerThread = new Thread(ListenLoop)
            {
                IsBackground = true,
                Name = "RhythmCafeBridgeHttp",
            };
            _workerThread.Start();

            Main.Instance?.Logger.LogInfo($"Local bridge started at http://127.0.0.1:{Port}/");
            return true;
        }
        catch (Exception ex)
        {
            Main.Instance?.Logger.LogError($"Failed to start local bridge: {ex.Message}");
            Stop();
            return false;
        }
    }

    public void ProcessPending()
    {
        _queue.ProcessPending();
        _cachedHealth = _handlers.BuildHealth(Port);
    }

    public void Stop()
    {
        _running = false;
        _events.Dispose();

        try
        {
            _listener?.Stop();
            _listener?.Close();
        }
        catch
        {
            // Best-effort shutdown.
        }

        _listener = null;
        _workerThread = null;
    }

    public void Dispose()
    {
        Stop();
    }

    private void ListenLoop()
    {
        while (_running && _listener != null && _listener.IsListening)
        {
            try
            {
                var context = _listener.GetContext();
                _ = Task.Run(() => HandleRequest(context));
            }
            catch (HttpListenerException)
            {
                if (!_running) break;
            }
            catch (ObjectDisposedException)
            {
                break;
            }
            catch (Exception ex)
            {
                Main.Instance?.Logger.LogError($"Bridge listener error: {ex.Message}");
            }
        }
    }

    private async Task HandleRequest(HttpListenerContext context)
    {
        var request = context.Request;
        var response = context.Response;
        var origin = request.Headers["Origin"];
        var isEventStream = false;

        try
        {
            if (!BridgeHttp.IsOriginAllowed(origin, _settings))
            {
                BridgeHttp.WriteJson(
                    response,
                    403,
                    BridgeJson.Serialize(BridgeResponse.Fail("ORIGIN_NOT_ALLOWED", "当前网页来源未被允许。")),
                    null,
                    _settings);
                return;
            }

            if (request.HttpMethod.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase))
            {
                BridgeHttp.WriteOptions(response, origin, _settings);
                return;
            }

            var path = request.Url?.AbsolutePath.TrimEnd('/') ?? string.Empty;
            if (request.HttpMethod.Equals("GET", StringComparison.OrdinalIgnoreCase)
                && path.Equals("/events", StringComparison.OrdinalIgnoreCase))
            {
                isEventStream = true;
                await _events.HandleAsync(context, origin, _settings).ConfigureAwait(false);
                return;
            }

            if (request.HttpMethod.Equals("GET", StringComparison.OrdinalIgnoreCase)
                && path.Equals("/health", StringComparison.OrdinalIgnoreCase))
            {
                BridgeHttp.WriteJson(response, 200, BridgeJson.Serialize(_cachedHealth), origin, _settings);
                return;
            }

            if (request.HttpMethod.Equals("POST", StringComparison.OrdinalIgnoreCase)
                && path.Equals("/open-level", StringComparison.OrdinalIgnoreCase))
            {
                if (request.ContentLength64 > 1024 * 1024)
                {
                    BridgeHttp.WriteJson(
                        response,
                        413,
                        BridgeJson.Serialize(BridgeResponse.Fail("REQUEST_TOO_LARGE", "请求内容过大。")),
                        origin,
                        _settings);
                    return;
                }

                var body = await ReadBodyAsync(request).ConfigureAwait(false);
                var result = await _handlers.HandleOpenLevelAsync(body).ConfigureAwait(false);
                BridgeHttp.WriteJson(response, result.StatusCode, BridgeJson.Serialize(result.Body), origin, _settings);
                return;
            }

            BridgeHttp.WriteJson(
                response,
                404,
                BridgeJson.Serialize(BridgeResponse.Fail("NOT_FOUND", "接口不存在。")),
                origin,
                _settings);
        }
        catch (Exception ex)
        {
            Main.Instance?.Logger.LogError($"Bridge request failed: {ex}");
            try
            {
                BridgeHttp.WriteJson(
                    response,
                    500,
                    BridgeJson.Serialize(BridgeResponse.Fail("SERVER_ERROR", "服务异常，请查看游戏日志。")),
                    origin,
                    _settings);
            }
            catch
            {
                // The browser may have disconnected already.
            }
        }
        finally
        {
            if (!isEventStream)
            {
                try
                {
                    response.Close();
                }
                catch
                {
                    // Ignore closed responses.
                }
            }
        }
    }

    private static async Task<string> ReadBodyAsync(HttpListenerRequest request)
    {
        using var reader = new StreamReader(request.InputStream, request.ContentEncoding ?? Encoding.UTF8);
        return await reader.ReadToEndAsync().ConfigureAwait(false);
    }
}
