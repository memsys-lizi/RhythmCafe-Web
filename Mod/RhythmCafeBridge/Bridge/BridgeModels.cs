using System;

namespace RhythmCafeBridge.Bridge;

[Serializable]
internal sealed class OpenLevelRequest
{
    public string levelId = string.Empty;
    public string downloadUrl = string.Empty;
    public string fileName = string.Empty;
}

[Serializable]
internal sealed class HealthResponse
{
    public bool connected;
    public string modVersion = string.Empty;
    public int port;
    public string scene = string.Empty;
    public bool gameReady;
    public bool busy;
}

[Serializable]
internal sealed class BridgeResponse
{
    public bool success;
    public string state = string.Empty;
    public string code = string.Empty;
    public string message = string.Empty;
    public string requestId = string.Empty;

    public static BridgeResponse Ok(string message, string state, string requestId = "")
    {
        return new BridgeResponse
        {
            success = true,
            state = state,
            code = "OK",
            message = message,
            requestId = requestId,
        };
    }

    public static BridgeResponse Fail(string code, string message, string requestId = "")
    {
        return new BridgeResponse
        {
            success = false,
            state = "error",
            code = code,
            message = message,
            requestId = requestId,
        };
    }
}

[Serializable]
internal sealed class ProgressEvent
{
    public string requestId = string.Empty;
    public string levelId = string.Empty;
    public string state = string.Empty;
    public long loaded;
    public long total = -1;
    public int percentage = -1;
    public string message = string.Empty;
}

internal sealed class BridgeHttpResult
{
    public int StatusCode { get; }
    public BridgeResponse Body { get; }

    public BridgeHttpResult(int statusCode, BridgeResponse body)
    {
        StatusCode = statusCode;
        Body = body;
    }

    public static BridgeHttpResult Ok(BridgeResponse body) => new(200, body);
    public static BridgeHttpResult BadRequest(string code, string message) => new(400, BridgeResponse.Fail(code, message));
    public static BridgeHttpResult Conflict(string code, string message) => new(409, BridgeResponse.Fail(code, message));
    public static BridgeHttpResult Error(string code, string message, string requestId = "") => new(500, BridgeResponse.Fail(code, message, requestId));
}
