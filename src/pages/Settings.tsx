import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { saveDeepSeekConfig, loadDeepSeekConfig, type DeepSeekConfigData } from "@/lib/storage";

const defaultDeepSeek = {
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  model: "deepseek-chat",
  maxTokens: 2000,
};

export default function Settings() {
  // iFlytek state (kept simple, not the focus of this revision)
  const [iflytekAppId, setIflytekAppId] = useState("");
  const [iflytekApiKey, setIflytekApiKey] = useState("");
  const [iflytekApiSecret, setIflytekApiSecret] = useState("");
  const [showIflytekKey, setShowIflytekKey] = useState(false);

  // DeepSeek state
  const [dsApiKey, setDsApiKey] = useState(defaultDeepSeek.apiKey);
  const [dsBaseUrl, setDsBaseUrl] = useState(defaultDeepSeek.baseUrl);
  const [dsModel, setDsModel] = useState(defaultDeepSeek.model);
  const [dsMaxTokens, setDsMaxTokens] = useState(defaultDeepSeek.maxTokens);
  const [showDsKey, setShowDsKey] = useState(false);
  const [dsStatus, setDsStatus] = useState("");
  const [dsSaveTime, setDsSaveTime] = useState("");
  const [dsLoading, setDsLoading] = useState(false);

  useEffect(() => {
    const saved = loadDeepSeekConfig();
    if (saved) {
      setDsApiKey(saved.apiKey);
      setDsBaseUrl(saved.baseUrl || defaultDeepSeek.baseUrl);
      setDsModel(saved.model || defaultDeepSeek.model);
      setDsMaxTokens(saved.maxTokens || defaultDeepSeek.maxTokens);
      setDsStatus("✅ 已配置");
      setDsSaveTime(formatTime(saved.savedAt));
    }
  }, []);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `最后更新：${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  };

  const handleSaveDeepSeek = () => {
    // Validate
    if (!dsApiKey.trim()) {
      toast("API 密钥不能为空", "error");
      return;
    }
    if (!dsBaseUrl.trim()) {
      toast("API 基础 URL 不能为空", "error");
      return;
    }
    if (!dsModel.trim()) {
      toast("模型名称不能为空", "error");
      return;
    }
    if (!dsMaxTokens || dsMaxTokens < 1) {
      toast("最大 Token 数必须大于 0", "error");
      return;
    }

    setDsLoading(true);
    try {
      const saved = saveDeepSeekConfig({
        apiKey: dsApiKey.trim(),
        baseUrl: dsBaseUrl.trim(),
        model: dsModel.trim(),
        maxTokens: dsMaxTokens,
      });
      setDsStatus("✅ 已配置");
      setDsSaveTime(formatTime(saved.savedAt));
      toast("DeepSeek 配置保存成功", "success");
    } catch {
      toast("保存失败，请重试", "error");
    } finally {
      setDsLoading(false);
    }
  };

  const handleSaveIflytek = () => {
    toast("讯飞配置功能将在后续完善", "info");
  };

  const handleClearIflytek = () => {
    setIflytekAppId("");
    setIflytekApiKey("");
    setIflytekApiSecret("");
    toast("讯飞配置已清除", "info");
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">应用设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置 API 密钥和相关参数</p>
      </div>

      <Tabs defaultValue="iflytek" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="iflytek">科大讯飞语音</TabsTrigger>
          <TabsTrigger value="deepseek">DeepSeek AI</TabsTrigger>
        </TabsList>

        {/* iFlytek Tab */}
        <TabsContent value="iflytek">
          <Card className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="appId">应用 ID <span className="text-red-400">*</span></Label>
              <Input
                id="appId"
                value={iflytekAppId}
                onChange={(e) => setIflytekAppId(e.target.value)}
                placeholder="输入科大讯飞应用 ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API 密钥 <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showIflytekKey ? "text" : "password"}
                  value={iflytekApiKey}
                  onChange={(e) => setIflytekApiKey(e.target.value)}
                  placeholder="输入 API 密钥"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  onClick={() => setShowIflytekKey(!showIflytekKey)}
                >
                  {showIflytekKey ? "隐藏" : "显示"}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  type={showIflytekKey ? "text" : "password"}
                  value={iflytekApiSecret}
                  onChange={(e) => setIflytekApiSecret(e.target.value)}
                  placeholder="输入 API Secret"
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSaveIflytek} className="bg-primary hover:bg-primary-600">
                保存配置
              </Button>
              <Button variant="outline" onClick={handleClearIflytek}>
                清除配置
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* DeepSeek Tab */}
        <TabsContent value="deepseek">
          <Card className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="dsApiKey">API 密钥 <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  id="dsApiKey"
                  type={showDsKey ? "text" : "password"}
                  value={dsApiKey}
                  onChange={(e) => setDsApiKey(e.target.value)}
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
                value={dsBaseUrl}
                onChange={(e) => setDsBaseUrl(e.target.value)}
                placeholder="https://api.deepseek.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">模型名称 <span className="text-red-400">*</span></Label>
              <Input
                id="model"
                value={dsModel}
                onChange={(e) => setDsModel(e.target.value)}
                placeholder="deepseek-chat"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens">最大 Token 数 <span className="text-red-400">*</span></Label>
              <Input
                id="maxTokens"
                type="number"
                min={1}
                max={8192}
                value={dsMaxTokens}
                onChange={(e) => setDsMaxTokens(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSaveDeepSeek}
                className="bg-primary hover:bg-primary-600"
                disabled={dsLoading}
              >
                {dsLoading ? "保存中..." : "保存配置"}
              </Button>
            </div>

            {dsStatus && (
              <div className="text-sm space-y-1">
                <p className={dsStatus.includes("✅") ? "text-green-600" : "text-red-500"}>
                  配置状态：{dsStatus}
                </p>
                {dsSaveTime && <p className="text-gray-400">{dsSaveTime}</p>}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
