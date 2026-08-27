using System;
using System.Linq;
using System.Net;
using System.Text;

namespace RhythmCafeBridge.Bridge;

internal static class BridgeHttp
{
    public static bool IsOriginAllowed(string? origin, Settings settings)
    {
        return string.IsNullOrWhiteSpace(origin)
            || settings.GetAllowedOrigins().Contains(origin, StringComparer.OrdinalIgnoreCase);
    }

    public static void ApplyCors(HttpListenerResponse response, string? origin, Settings settings)
    {
        if (string.IsNullOrWhiteSpace(origin) || !IsOriginAllowed(origin, settings))
        {
            return;
        }

        response.Headers["Access-Control-Allow-Origin"] = origin;
        response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
        response.Headers["Access-Control-Allow-Headers"] = "Content-Type";
        response.Headers["Access-Control-Allow-Private-Network"] = "true";
        response.Headers["Access-Control-Max-Age"] = "86400";
    }

    public static void WriteJson(HttpListenerResponse response, int statusCode, string json, string? origin, Settings settings)
    {
        var buffer = Encoding.UTF8.GetBytes(json);
        response.StatusCode = statusCode;
        response.ContentType = "application/json; charset=utf-8";
        response.ContentEncoding = Encoding.UTF8;
        ApplyCors(response, origin, settings);
        response.ContentLength64 = buffer.Length;
        response.OutputStream.Write(buffer, 0, buffer.Length);
    }

    public static void WriteOptions(HttpListenerResponse response, string? origin, Settings settings)
    {
        response.StatusCode = 204;
        ApplyCors(response, origin, settings);
        response.ContentLength64 = 0;
    }
}
