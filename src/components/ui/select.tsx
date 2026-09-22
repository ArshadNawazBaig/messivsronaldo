"use client";
import { useI18n } from "@/components/i18n-provider";
import { useCallback } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
export interface SelectOption {
    value: string;
    label: string;
    badge?: string;
    disabled?: boolean;
}
interface SelectProps {
    id?: string;
    label: string;
    menuLabel?: string;
    value: string;
    onValueChange: (value: string) => void;
    options: readonly SelectOption[];
    icon?: LucideIcon;
    className?: string;
}
export function Select({ id, label, menuLabel, value, onValueChange, options, icon: Icon, className = "" }: SelectProps) {
    const { t, locale } = useI18n();
    // Make the surrounding page inert while Radix traps focus in the open menu.
    // The returned ref cleanup restores existing inert states before focus returns.
    const menuRef = useCallback((node: HTMLDivElement | null) => {
        if (!node)
            return;
        const changed: HTMLElement[] = [];
        let branch: HTMLElement = node;
        while (branch.parentElement) {
            const parent = branch.parentElement;
            for (const sibling of parent.children) {
                if (sibling !== branch && sibling instanceof HTMLElement && !sibling.inert) {
                    sibling.inert = true;
                    changed.push(sibling);
                }
            }
            if (parent === document.body)
                break;
            branch = parent;
        }
        return () => {
            for (const element of changed)
                element.inert = false;
        };
    }, []);
    const selected = options.find(option => option.value === value);
    return <SelectPrimitive.Root dir={locale === "ar" ? "rtl" : "ltr"} value={value} onValueChange={onValueChange}>
    <SelectPrimitive.Trigger id={id} className={`select-trigger ${className}`} aria-label={t(label)}>
      {Icon && <Icon size={16} className="select-leading-icon" aria-hidden="true"/>}
      <span className="select-value"><SelectPrimitive.Value>{t(selected?.label)}</SelectPrimitive.Value></span>
      <SelectPrimitive.Icon className="select-chevron"><ChevronDown size={15} aria-hidden="true"/></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content ref={menuRef} className="select-content" position="popper" sideOffset={8} collisionPadding={12} aria-label={t(label)}>
        <SelectPrimitive.ScrollUpButton className="select-scroll-button"><ChevronUp size={15} aria-hidden="true"/></SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="select-viewport">
          <SelectPrimitive.Group>
            <SelectPrimitive.Label className="select-menu-label">{t(menuLabel ?? label)}</SelectPrimitive.Label>
            {options.map(option => <SelectPrimitive.Item key={option.value} value={option.value} disabled={option.disabled} tabIndex={option.disabled ? undefined : option.value === value ? 0 : -1} textValue={t(option.label)} aria-label={t(option.label)} className="select-option">
              <SelectPrimitive.ItemText>{t(option.label)}</SelectPrimitive.ItemText>
              {option.badge && <span className="select-option-badge" aria-hidden="true">{t(option.badge)}</span>}
              <span className="select-check-slot"><SelectPrimitive.ItemIndicator><Check size={15} strokeWidth={2.2} aria-hidden="true"/></SelectPrimitive.ItemIndicator></span>
            </SelectPrimitive.Item>)}
          </SelectPrimitive.Group>
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="select-scroll-button"><ChevronDown size={15} aria-hidden="true"/></SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}
