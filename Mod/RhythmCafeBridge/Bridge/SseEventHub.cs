using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace RhythmCafeBridge.Bridge;

internal sealed class SseEventHub : IDisposable
{
    private readonly ConcurrentDictionary<int, SseClient> _clients = new();
    private int _nextClientId;
    private volatile bool _disposed;

    public async Task HandleAsync(HttpListenerContext context, string? origin, Settings settings)
    {
        var response = context.Response;
        response.StatusCode = 200;
        response.ContentType = "text/event-stream; charset=utf-8";
        response.ContentEncoding = Encoding.UTF8;
        response.SendChunked = true;
        response.KeepAlive = true;
        response.Headers["Cache-Control"] = "no-cache";
        response.Headers["X-Accel-Buffering"] = "no";
        BridgeHttp.ApplyCors(response, origin, settings);

        var client = new SseClient(Interlocked.Increment(ref _nextClientId));
        if (_disposed)
        {
            client.Dispose();
            return;
        }

        _clients[client.Id] = client;

        try
        {
            using var writer = new StreamWriter(response.OutputStream, new UTF8Encoding(false))
            {
                AutoFlush = true,
            };

            await writer.WriteAsync("event: ready\ndata: {}\n\n").ConfigureAwait(false);

            while (!_disposed && !client.IsCompleted)
            {
                if (client.Messages.TryTake(out var message, TimeSpan.FromSeconds(15)))
                {
                    await writer.WriteAsync(message).ConfigureAwait(false);
                }
                else
                {
                    await writer.WriteAsync(": keepalive\n\n").ConfigureAwait(false);
                }
            }
        }
        catch (IOException)
        {
            // The browser disconnected.
        }
        catch (ObjectDisposedException)
        {
            // The bridge is shutting down.
        }
        finally
        {
            _clients.TryRemove(client.Id, out _);
            client.Dispose();
            try
            {
                response.Close();
            }
            catch
            {
                // Ignore an already closed response.
            }
        }
    }

    public void Publish(string eventName, string eventId, string json)
    {
        if (_disposed) return;

        var message = $"event: {eventName}\nid: {eventId}\ndata: {json}\n\n";
        foreach (var client in _clients.Values)
        {
            client.TryPublish(message);
        }
    }

    public void Dispose()
    {
        _disposed = true;
        foreach (var client in _clients.Values)
        {
            client.Dispose();
        }

        _clients.Clear();
    }

    private sealed class SseClient : IDisposable
    {
        public int Id { get; }
        public BlockingCollection<string> Messages { get; } = new();
        public bool IsCompleted => Messages.IsAddingCompleted;

        public SseClient(int id)
        {
            Id = id;
        }

        public void TryPublish(string message)
        {
            try
            {
                if (!Messages.IsAddingCompleted)
                {
                    Messages.Add(message);
                }
            }
            catch (InvalidOperationException)
            {
                // The client disconnected between the check and Add.
            }
        }

        public void Dispose()
        {
            Messages.CompleteAdding();
            Messages.Dispose();
        }
    }
}
