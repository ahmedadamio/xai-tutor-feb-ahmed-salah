import { cx } from "../../../lib/utils";

export function SidebarItem({
  label,
  icon,
  active,
  collapsed,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  collapsed: boolean;
}) {
  return (
    <button
      type="button"
      className={cx(
        "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] transition-all duration-200",
        active
          ? "bg-[#ececef] text-[#1f2937] shadow-[inset_0_0_0_1px_rgba(209,213,219,0.45)]"
          : "text-[#6b7280] hover:bg-[#ececef] hover:text-[#374151]",
        collapsed && "justify-center px-2"
      )}
      title={label}
    >
      <span className="opacity-80">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}
