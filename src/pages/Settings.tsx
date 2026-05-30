import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveConfig, loadConfig, type AppConfig } from "@/lib/commands";

const defaultConfig: AppConfig = {
  iflytek: { appId: "ccd6f814", apiKey: "", apiSecret: "" },
  deepseek: {
    apiKey: "",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    maxTokens: 2000,
    temperature: 0.7,
  },
  interview: { region: "zh-cn", position: "frontend", language: "typescript", customQaEnabled: false },
};

export default function Settings() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [showKey, setShowKey] = useState(false);
  const [showDsKey, setShowDsKey] = useState(false);
  const [iflytekStatus, setIflytekStatus] = useState("");
  const [saveTime, setSaveTime] = useState("");

  useEffect(() => {
    loadConfig()
      .then((json) => {
        if (json && json !== "{}") {
          const parsed = JSON.parse(json);
          setConfig({ ...defaultConfig, ...parsed });
          if (parsed.iflytek?.apiKey) {
            setIflytekStatus("✅ 已配置");
            updateSaveTime();
          }
        }
      })
      .catch(() => {});
  }, []);

  const updateSaveTime = () => {
    const now = new Date();
    setSaveTime(
      `最后更新：${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    );
  };

  const handleSaveIflytek = async () => {
    try {
      await saveConfig(config);
      setIflytekStatus("✅ 已配置");
      updateSaveTime();
    } catch (err) {
      setIflytekStatus("❌ 保存失败");
      console.error(err);
    }
  };

  const handleClearIflytek = () => {
    setConfig({ ...config, iflytek: { appId: "", apiKey: "", apiSecret: "" } });
    setIflytekStatus("");
    setSaveTime("");
  };

  const handleSaveDeepseek = async () => {
    try {
      await saveConfig(config);
      setIflytekStatus("✅ 已配置");
      updateSaveTime();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">应用设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置API密钥和相关参数</p>
      </div>

      <Tabs defaultValue="iflytek" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="iflytek">科大讯飞语音</TabsTrigger>
          <TabsTrigger value="deepseek">DeepSeek AI</TabsTrigger>
        </TabsList>

        <TabsContent value="iflytek">
          <Card className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="appId">应用 ID <span className="text-red-400">*</span></Label>
              <Input
                id="appId"
                value={config.iflytek.appId}
                onChange={(e) => setConfig({ ...config, iflytek: { ...config.iflytek, appId: e.target.value } })}
                placeholder="输入科大讯飞应用ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API 密钥 <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  value={config.iflytek.apiKey}
                  onChange={(e) => setConfig({ ...config, iflytek: { ...config.iflytek, apiKey: e.target.value } })}
                  placeholder="输入API密钥"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  type={showKey ? "text" : "password"}
                  value={config.iflytek.apiSecret}
                  onChange={(e) => setConfig({ ...config, iflytek: { ...config.iflytek, apiSecret: e.target.value } })}
                  placeholder="输入API Secret"
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSaveIflytek} className="bg-primary hover:bg-primary-600">保存配置</Button>
              <Button variant="outline" onClick={handleClearIflytek}>清除配置</Button>
            </div>
            {iflytekStatus && (
              <div className="text-sm space-y-1">
                <p className={iflytekStatus.includes("✅") ? "text-green-600" : "text-red-500"}>
                  配置状态：{iflytekStatus}
                </p>
                {saveTime && <p className="text-gray-400">{saveTime}</p>}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="deepseek">
          <Card className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="dsApiKey">API 密钥 <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="dsApiKey"
                  type={showDsKey ? "text" : "password"}
                  value={config.deepseek.apiKey}
                  onChange={(e) => setConfig({ ...config, deepseek: { ...config.deepseek, apiKey: e.target.value } })}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  onClick={() => setShowDsKey(!showDsKey)}
                >
                  {showDsKey ? "隐藏" : "显示"}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseUrl">API 基础 URL <span className="text-red-400">*</span></Label>
              <Input
                id="baseUrl"
                value={config.deepseek.baseUrl}
                onChange={(e) => setConfig({ ...config, deepseek: { ...config.deepseek, baseUrl: e.target.value } })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">模型名称 <span className="text-red-400">*</span></Label>
              <Input
                id="model"
                value={config.deepseek.model}
                onChange={(e) => setConfig({ ...config, deepseek: { ...config.deepseek, model: e.target.value } })}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maxTokens">最大 Token 数 <span className="text-red-400">*</span></Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={config.deepseek.maxTokens}
                  onChange={(e) => setConfig({ ...config, deepseek: { ...config.deepseek, maxTokens: parseInt(e.target.value) || 2000 } })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">温度 (Temperature) <span className="text-red-400">*</span></Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={config.deepseek.temperature}
                  onChange={(e) => setConfig({ ...config, deepseek: { ...config.deepseek, temperature: parseFloat(e.target.value) || 0.7 } })}
                />
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={handleSaveDeepseek} className="bg-primary hover:bg-primary-600">保存配置</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
