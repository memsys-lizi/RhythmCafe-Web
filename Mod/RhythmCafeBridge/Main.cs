using System;
using System.Collections;
using BepInEx;
using BepInEx.Logging;
using RhythmCafeBridge.Bridge;
using UnityEngine.SceneManagement;

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
    private bool _openCustomLevelLibraryOnReturn;

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

        if (_openCustomLevelLibraryOnReturn
            && SceneManager.GetActiveScene().name == GC.SceneCustomLevelSelect)
        {
            _openCustomLevelLibraryOnReturn = false;
            StartCoroutine(OpenCustomLevelLibraryWhenReady());
        }
    }

    public void PrepareCustomLevelLibraryReturn()
    {
        scnBase.currentLevelSelect = GC.SceneCustomLevelSelect;
        _openCustomLevelLibraryOnReturn = true;
    }

    private static IEnumerator OpenCustomLevelLibraryWhenReady()
    {
        while (scnCLS.instance == null)
        {
            yield return null;
        }

        // scnCLS.instance is assigned during Awake; give its Start method a
        // frame to initialize the ward/library state before inspecting it.
        yield return null;

        // If scnCLS is already restoring its own cached library state, let that
        // official coroutine finish instead of starting a second load.
        while (scnCLS.instance.ShowingWard && !scnCLS.instance.CanReceiveInput)
        {
            yield return null;
        }

        if (!scnCLS.instance.ShowingWard)
        {
            yield break;
        }

        if (SteamIntegration.initialized)
        {
            SteamWorkshop.ClearItemsInfoCache();
        }

        scnCLS.instance.StartCoroutine(scnCLS.instance.LoadLevelsData());
    }

    private void OnDestroy()
    {
        _bridgeServer?.Dispose();
        _bridgeServer = null;
        Instance = null;
    }
}
