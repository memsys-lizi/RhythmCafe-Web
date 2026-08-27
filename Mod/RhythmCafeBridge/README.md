# RhythmCafe Bridge

Rhythm Doctor 的 BepInEx 插件，用于让 RhythmCafe 网站把谱面下载并直接交给游戏游玩。

## 构建

```powershell
dotnet build -c Release
```

项目会把插件复制到 `out/`，并部署到：

```text
D:\Steam\steamapps\common\Rhythm Doctor\BepInEx\plugins\RhythmCafeBridge
```

构建不会自动启动游戏。

默认配置会写入 BepInEx 的配置目录，包含桥接端口、允许访问网站来源、允许下载的域名、谱面目录和最大下载大小。默认端口是 `2771`；网站默认使用的来源是：

- `https://cafe.rhythmdoctor.top`
- `http://localhost:5173`
- `http://127.0.0.1:5173`

如果修改了端口或网站来源，需要同时更新网站的桥接配置或重新构建前端。

## 通信接口

- `GET http://127.0.0.1:2771/health`
- `GET http://127.0.0.1:2771/events`
- `POST http://127.0.0.1:2771/open-level`

打开谱面的请求体：

```json
{
  "levelId": "rcXsW2Mc",
  "downloadUrl": "https://cafe.rhythmdoctor.top/api/levels/rcXsW2Mc/download",
  "fileName": "level.zip"
}
```

谱面会保存到当前用户的 `Documents/Rhythm Doctor/Levels` 目录。
