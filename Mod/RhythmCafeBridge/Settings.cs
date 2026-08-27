using System;
using System.IO;
using System.Linq;
using BepInEx.Configuration;

namespace RhythmCafeBridge;

public sealed class Settings
{
    public ConfigEntry<int> Port { get; }
    public ConfigEntry<string> AllowedOrigins { get; }
    public ConfigEntry<string> AllowedDownloadHosts { get; }
    public ConfigEntry<string> LevelDirectory { get; }
    public ConfigEntry<int> MaxDownloadMiB { get; }

    public Settings(ConfigFile config)
    {
        var defaultLevelDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "Rhythm Doctor",
            "Levels");

        Port = config.Bind(
            "Bridge",
            "Port",
            2771,
            new ConfigDescription("Local HTTP bridge port."));

        AllowedOrigins = config.Bind(
            "Bridge",
            "AllowedOrigins",
            "https://cafe.rhythmdoctor.top,http://localhost:5173,http://127.0.0.1:5173",
            new ConfigDescription("Comma-separated browser origins allowed to call the bridge."));

        AllowedDownloadHosts = config.Bind(
            "Bridge",
            "AllowedDownloadHosts",
            "cafe.rhythmdoctor.top",
            new ConfigDescription("Comma-separated HTTPS download hosts allowed by the bridge."));

        LevelDirectory = config.Bind(
            "Storage",
            "LevelDirectory",
            defaultLevelDirectory,
            new ConfigDescription("Rhythm Doctor custom level directory."));

        MaxDownloadMiB = config.Bind(
            "Storage",
            "MaxDownloadMiB",
            512,
            new ConfigDescription(
                "Maximum accepted archive size in MiB.",
                new AcceptableValueRange<int>(16, 4096)));
    }

    public string[] GetAllowedOrigins()
    {
        return Split(AllowedOrigins.Value);
    }

    public string[] GetAllowedDownloadHosts()
    {
        return Split(AllowedDownloadHosts.Value);
    }

    private static string[] Split(string value)
    {
        return value
            .Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(item => item.Trim())
            .Where(item => item.Length > 0)
            .ToArray();
    }
}
