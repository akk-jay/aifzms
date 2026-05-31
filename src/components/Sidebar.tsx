import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { to: "/", label: "首页", icon: "🏠" },
  { to: "/settings", label: "系统设置", icon: "⚙️" },
  { to: "/records", label: "面试记录", icon: "📋" },
  { to: "/help", label: "帮助", icon: "❓" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col shrink-0">
      <div className="px-6 py-6">
        <img
          src="/logo.jpg"
          alt="AI 面试助手"
          className="h-10 w-auto mb-3"
        />
        <h1 className="text-lg font-bold text-primary">AI 面试助手</h1>
        <p className="text-xs text-gray-400 mt-1">本地桌面版</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary-50 text-primary font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="text-xs text-gray-400 mb-1">面试管理</div>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors",
              isActive ? "text-primary font-medium" : "text-gray-500 hover:text-gray-700"
            )
          }
        >
          📝 新的面试
        </NavLink>
        <NavLink
          to="/records"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors",
              isActive ? "text-primary font-medium" : "text-gray-500 hover:text-gray-700"
            )
          }
        >
          📋 面试记录
        </NavLink>
      </div>
    </aside>
  );
}
