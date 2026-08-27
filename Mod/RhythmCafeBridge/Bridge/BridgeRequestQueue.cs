using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;

namespace RhythmCafeBridge.Bridge;

internal sealed class BridgeRequestQueue
{
    private readonly ConcurrentQueue<Action> _pending = new();

    public Task<T> Enqueue<T>(Func<T> action)
    {
        var completion = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);

        _pending.Enqueue(() =>
        {
            try
            {
                completion.SetResult(action());
            }
            catch (Exception ex)
            {
                completion.SetException(ex);
            }
        });

        return completion.Task;
    }

    public void ProcessPending(int maxActions = 8)
    {
        for (var index = 0; index < maxActions && _pending.TryDequeue(out var action); index++)
        {
            action();
        }
    }
}
