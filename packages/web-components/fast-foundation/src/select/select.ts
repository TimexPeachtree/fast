import { attr, DOM, observable, volatile } from "@microsoft/fast-element";
import { Listbox } from "../listbox";
import { ListboxOption } from "../listbox-option/listbox-option";
import { ListboxOptionRole } from "../listbox-option/listbox-option.options";
import { ARIAGlobalStatesAndProperties } from "../patterns/aria-global";
import { StartEnd } from "../patterns/start-end";
import { applyMixins } from "../utilities/apply-mixins";
import { SelectPosition, SelectRole } from "./select.options";

/**
 * A Select Custom HTML Element.
 * Implements the {@link https://www.w3.org/TR/wai-aria-1.1/#select | ARIA select }.
 *
 * @public
 */
export class Select extends Listbox {
    protected proxy: HTMLSelectElement = document.createElement("select");

    /**
     * The open attribute.
     *
     * @internal
     */
    @attr({ attribute: "open", mode: "boolean" })
    public open: boolean = false;
    protected openChanged() {
        this.ariaExpanded = this.open ? "true" : "false";
        if (this.open) {
            this.setPositioning();
        }
    }

    /**
     *  Reflects the placement for the listbox when the select is open.
     *
     * @public
     */
    @attr({ attribute: "position", mode: "fromView" })
    public positionAttribute: SelectPosition;

    /**
     * The role of the element.
     *
     * @public
     * @remarks
     * HTML Attribute: role
     */
    @attr
    public role: SelectRole = SelectRole.combobox;

    @observable
    position: SelectPosition = SelectPosition.below;

    /**
     * Calculate and apply listbox positioning based on available viewport space.
     *
     * @param force - direction to force the listbox to display
     * @public
     */
    public setPositioning(): void {
        const currentBox = this.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const availableBottom = viewportHeight - currentBox.bottom;

        if (this.positionAttribute) {
            this.position = this.positionAttribute;
        } else {
            this.position =
                currentBox.top > availableBottom
                    ? SelectPosition.above
                    : SelectPosition.below;
        }

        if (this.position === SelectPosition.above) {
            this.maxHeight = ~~currentBox.top;
            return;
        }

        if (this.position === SelectPosition.below) {
            this.maxHeight = ~~availableBottom;
        }
    }

    /**
     * The max height for the listbox when opened.
     *
     * @internal
     */
    @observable
    public maxHeight: number = 0;

    /**
     * The value displayed on the button.
     *
     * @public
     */
    @volatile
    public get displayValue(): string {
        if (this.firstSelectedOption) {
            return this.firstSelectedOption.textContent || this.firstSelectedOption.value;
        }
        return "";
    }

    /**
     * Sets the value when the options are changed.
     *
     * @param prev - The previous value
     * @param next - the new value
     * @internal
     */
    protected selectedOptionsChanged(prev, next): void {
        super.selectedOptionsChanged(prev, next);
        if (this.$fastController.isConnected) {
            this.value = this.firstSelectedOption.value;
        }
    }

    /**
     * @internal
     */
    public clickHandler(e: MouseEvent): boolean | void {
        // do nothing if the select is disabled
        if (this.disabled) {
            return;
        }

        super.clickHandler(e);

        if (this.open) {
            const captured = (e.target as HTMLElement).closest(
                `[role=${ListboxOptionRole.option}]`
            ) as ListboxOption;
            if (captured && captured.disabled) {
                return;
            }
        }

        this.open = !this.open;

        return true;
    }

    public focusoutHandler(e: FocusEvent): boolean | void {
        if (!this.open) {
            return true;
        }

        const focusTarget = e.relatedTarget as HTMLElement;
        if (this.isSameNode(focusTarget)) {
            DOM.queueUpdate(() => this.focus());
            return;
        }

        if (!this.options.includes(focusTarget as ListboxOption)) {
            this.open = false;
        }
    }

    public keydownHandler(e: KeyboardEvent): boolean | void {
        super.keydownHandler(e);
        const key = e.key || e.key.charCodeAt(0);

        switch (key) {
            case " ":
                if (!this.typeAheadExpired) {
                    return true;
                }

            case "Enter":
                this.open = !this.open;
                break;

            case "Escape":
                this.open = false;
                break;
        }

        return true;
    }

    public connectedCallback() {
        super.connectedCallback();
        DOM.queueUpdate(() => {
            if (this.proxy instanceof HTMLElement) {
                this.options.forEach(({ proxy }) => this.proxy.add(proxy));
            }
        });
    }

    @observable
    public value: string;
    protected valueChanged(previous, next): void {
        super.valueChanged(previous, next);
        if (this instanceof Select) {
            const selectedOption = this.options.findIndex(o => o.value === this.value);
            this.setSelectedOption(selectedOption);
        }
    }
}

/**
 * Includes ARIA states and properties relating to the ARIA select role.
 *
 * @public
 */
export class DelegatesARIASelect extends ARIAGlobalStatesAndProperties {
    /**
     * See {@link https://www.w3.org/WAI/PF/aria/roles#button} for more information
     * @public
     * @remarks
     * HTML Attribute: aria-expanded
     */
    @observable
    public ariaExpanded: "true" | "false" | undefined;
}

/**
 * @internal
 */
export interface Select extends StartEnd, DelegatesARIASelect {}
applyMixins(Select, StartEnd, DelegatesARIASelect);
