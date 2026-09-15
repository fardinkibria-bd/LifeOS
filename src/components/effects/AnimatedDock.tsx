import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { navGroups, navItems } from "@/config/navigation";
import { useRouter } from "@/context/RouterContext";
import { useAuth } from "@/context/AuthContext";
import { useQuickAdd } from "@/context/QuickAddContext";
import { ChevronLeft, Plus, Search } from "lucide-react";
import { LifeOSLogo } from "@/components/brand/LifeOSLogo";

interface DockItemState {
  value: number;
  velocity: number;
  targetWidth: number;
  targetHeight: number;
  restWidth: number;
  restHeight: number;
}

const PROXIMITY = 122;
const SPRING = 0.19;
const DAMPING = 0.7;
const MAX_WIDTH_GROWTH = 17;
const MAX_HEIGHT_GROWTH = 16;
const MAX_TRANSLATE_Y = 3.5;

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function AnimatedDock({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { route, navigate } = useRouter();
  const { profile } = useAuth();
  const { open } = useQuickAdd();
  const containerRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const statesRef = useRef<Map<string, DockItemState>>(new Map());
  const rafRef = useRef<number>(0);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const focusedIdRef = useRef<string | null>(null);
  const [isCoarse] = useState(
    () => window.matchMedia("(pointer: coarse)").matches,
  );
  const reducedMotion = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const isActive = (id: string) => route.startsWith(`/${id}`);

  const updateLayout = useCallback(() => {
    itemRefs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect();
      const state = statesRef.current.get(id);
      if (state) {
        state.restWidth = rect.width;
        state.restHeight = rect.height;
      } else {
        statesRef.current.set(id, {
          value: 0,
          velocity: 0,
          targetWidth: rect.width,
          targetHeight: rect.height,
          restWidth: rect.width,
          restHeight: rect.height,
        });
      }
    });
  }, []);

  const animate = useCallback(() => {
    if (!containerRef.current) return;
    if (isCoarse || reducedMotion.current || collapsed) {
      itemRefs.current.forEach((el) => {
        el.style.transform = "";
        el.style.filter = "";
      });
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    itemRefs.current.forEach((el, id) => {
      const state = statesRef.current.get(id);
      if (!state) return;
      const rect = el.getBoundingClientRect();
      const focused = focusedIdRef.current === id;
      const distance = focused
        ? 0
        : Math.abs(pointerRef.current.y - (rect.top + rect.height / 2));
      const influence = smoothstep(clamp(1 - distance / PROXIMITY, 0, 1));

      state.velocity += (influence - state.value) * SPRING;
      state.velocity *= DAMPING;
      state.value += state.velocity;

      const widthGrowth = state.value * MAX_WIDTH_GROWTH;
      const heightGrowth = state.value * MAX_HEIGHT_GROWTH;
      const translateY = state.value * MAX_TRANSLATE_Y;

      el.style.transform = `translateY(${translateY}px) scaleX(${1 + widthGrowth / state.restWidth}) scaleY(${1 + heightGrowth / state.restHeight})`;
      el.style.filter = `brightness(${1 + state.value * 0.15})`;
    });

    rafRef.current = requestAnimationFrame(animate);
  }, [isCoarse, collapsed]);

  useEffect(() => {
    const container = containerRef.current;
    rafRef.current = requestAnimationFrame(animate);
    const ro = new ResizeObserver(updateLayout);
    if (container) ro.observe(container);

    const handlePointer = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleLeave = () => {
      pointerRef.current = { x: -9999, y: -9999 };
    };
    const handleFocus = (event: FocusEvent) => {
      const item = event.target as HTMLButtonElement;
      focusedIdRef.current = item.dataset.dockId || null;
    };
    const handleBlur = () => {
      focusedIdRef.current = null;
    };

    container?.addEventListener("pointermove", handlePointer);
    container?.addEventListener("pointerleave", handleLeave);
    container?.addEventListener("focusin", handleFocus);
    container?.addEventListener("focusout", handleBlur);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      container?.removeEventListener("pointermove", handlePointer);
      container?.removeEventListener("pointerleave", handleLeave);
      container?.removeEventListener("focusin", handleFocus);
      container?.removeEventListener("focusout", handleBlur);
    };
  }, [animate, updateLayout]);

  useEffect(() => {
    const timer = setTimeout(updateLayout, 50);
    return () => clearTimeout(timer);
  }, [collapsed, updateLayout]);

  return (
    <aside
      ref={containerRef}
      className={cn(
        "lifeos-sidebar hidden lg:flex h-[calc(100%-2rem)] self-center my-4 ml-4 rounded-[22px] overflow-hidden flex-col transition-[width] duration-300 ease-out-quart shrink-0 z-20 dock-container",
        collapsed ? "w-[72px]" : "w-[248px]",
      )}
    >
      <div className="lifeos-sidebar-brand flex h-[68px] items-center gap-3 px-4 shrink-0">
        <button
          onClick={collapsed ? onToggleCollapse : undefined}
          className="lifeos-sidebar-mark flex h-9 w-9 shrink-0 items-center justify-center"
          title={collapsed ? "Expand sidebar" : undefined}
          aria-label={collapsed ? "Expand sidebar" : undefined}
        >
          <LifeOSLogo className="h-7 w-7" />
        </button>
        {!collapsed && <span className="lifeos-sidebar-wordmark">LifeOS</span>}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="lifeos-sidebar-collapse flex h-8 w-8 shrink-0 items-center justify-center"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="lifeos-sidebar-actions flex flex-col gap-2 p-3">
        <button
          onClick={open}
          className={cn(
            "lm-btn lm-primary lifeos-sidebar-add flex items-center justify-center gap-2",
            collapsed ? "h-10 w-10" : "h-10 w-full",
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Add</span>}
        </button>
        <button
          onClick={() => navigate("/search")}
          className={cn(
            "lifeos-sidebar-search flex items-center",
            collapsed ? "h-10 w-10 justify-center" : "h-10 w-full gap-2",
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-body-sm">Search</span>}
          {!collapsed && (
            <kbd className="ml-auto text-caption text-text-muted">Cmd K</kbd>
          )}
        </button>
      </div>

      <nav
        className="lifeos-sidebar-nav flex-1 overflow-y-auto scrollbar-thin py-3"
        aria-label="LifeOS navigation"
      >
        {navGroups.map((group) => (
          <div key={group.id} className="lifeos-sidebar-group mb-3">
            {!collapsed && (
              <p className="lifeos-sidebar-group-label px-5 py-2">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.id);
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    if (el) itemRefs.current.set(item.id, el);
                  }}
                  onClick={() => navigate(`/${item.id}`)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "dock-item lifeos-sidebar-item flex items-center gap-3 mx-3 px-3 relative group",
                    "will-change-transform focus-visible:outline-none",
                    active
                      ? "text-accent bg-accent/10 shadow-glow-sm-primary dock-item-active"
                      : "text-text-secondary",
                    collapsed && "justify-center w-[calc(100%-24px)]",
                  )}
                  style={{
                    width: "calc(100% - 24px)",
                    transformOrigin: "center center",
                  }}
                  data-dock-id={item.id}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-accent shadow-glow-sm-primary" />
                  )}
                  <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="lifeos-sidebar-profile p-3 flex items-center gap-2">
        <button
          onClick={() => navigate("/settings")}
          className={cn(
            "lifeos-sidebar-profile-button flex items-center gap-2 min-w-0",
            collapsed ? "h-10 w-10 justify-center" : "px-2 py-2 flex-1",
          )}
        >
          <div className="lifeos-sidebar-avatar flex h-8 w-8 shrink-0 items-center justify-center">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <LifeOSLogo className="h-7 w-7" />
            )}
          </div>
          {!collapsed && (
            <span className="lifeos-sidebar-user truncate">
              {profile?.display_name || "User"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
