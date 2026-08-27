using System;
using BepInEx;
using BepInEx.Logging;
using RhythmCafeBridge.Bridge;

namespace RhythmCafeBridge;

[BepInPlugin(PLUGIN_GUID, PLUGIN_NAME, PLUGIN_VERSION)]
public sealed class Main : BaseUnityPlugin
{
    public const string PLUGIN_GUID = "com.rhythmcafe.bridge";
    public const string PLUGIN_NAME = "RhythmCafe Bridge";
    public const string PLUGIN_VERSION = "0.1.0";

    public static Main? Instance { get; private set; }

    public new ManualLogSource Logger { get; private set; } = null!;

    public Settings Settings { get; private set; } = null!;

    private LocalBridgeServer? _bridgeServer;

    private void Awake()
    {
        Instance = this;
        Logger = base.Logger;

        try
        {
            Settings = new Settings(Config);
            _bridgeServer = new LocalBridgeServer(Settings);

            if (_bridgeServer.Start())
            {
                Logger.LogInfo($"{PLUGIN_NAME} v{PLUGIN_VERSION} loaded on port {_bridgeServer.Port}.");
            }
            else
            {
                Logger.LogError("RhythmCafe Bridge could not start its local HTTP server.");
            }
        }
        catch (Exception ex)
        {
            Logger.LogError($"Failed to load {PLUGIN_NAME}: {ex}");
        }
    }

    private void Update()
    {
        _bridgeServer?.ProcessPending();
    }

    private void OnDestroy()
    {
        _bridgeServer?.Dispose();
        _bridgeServer = null;
        Instance = null;
    }
}
