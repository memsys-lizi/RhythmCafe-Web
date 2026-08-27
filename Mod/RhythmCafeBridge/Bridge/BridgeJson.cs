using UnityEngine;

namespace RhythmCafeBridge.Bridge;

internal static class BridgeJson
{
    public static bool TryDeserialize<T>(string json, out T? value) where T : class
    {
        try
        {
            value = JsonUtility.FromJson<T>(json);
            return value != null;
        }
        catch
        {
            value = null;
            return false;
        }
    }

    public static string Serialize<T>(T value)
    {
        return JsonUtility.ToJson(value);
    }
}
