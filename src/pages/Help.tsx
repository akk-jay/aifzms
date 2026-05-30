import { Card } from "@/components/ui/card";

export default function Help() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">帮助</h1>
        <p className="text-sm text-gray-500 mt-1">使用说明与常见问题</p>
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-2">🚀 快速开始</h3>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>在「系统设置」中配置科大讯飞和 DeepSeek 的 API 密钥</li>
            <li>在首页选择面试地区和岗位</li>
            <li>点击「前往面试」启动面试辅助窗口</li>
            <li>在面试窗口中按空格键控制录音和回答生成</li>
          </ol>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-2">⌨️ 快捷键</h3>
          <p className="text-sm text-gray-600">
            <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">空格</kbd>
            — 开始录音 / 停止录音并生成回答
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-2">🪟 面试窗口说明</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>辅助窗口（半透明）</strong>：显示当前一轮问答，空格键控制，始终置顶</p>
            <p><strong>记录窗口</strong>：完整记录所有问答，可滚动查看</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-800 mb-2">🔑 API 密钥获取</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>科大讯飞 RTASR：<a href="https://www.xfyun.cn/" className="text-primary underline" target="_blank" rel="noreferrer">讯飞开放平台</a></p>
            <p>DeepSeek：<a href="https://platform.deepseek.com/" className="text-primary underline" target="_blank" rel="noreferrer">DeepSeek 开放平台</a></p>
          </div>
        </Card>
      </div>
    </div>
  );
}
