/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { CSSObjectWithLabel, StylesConfig } from "react-select";

// Props are typed as unknown so the helper does not take part in the Option
// type inference of each Select.
type StyleFn = (base: CSSObjectWithLabel, props: unknown) => CSSObjectWithLabel;
export type ThemedSelectStyles = { [K in keyof StylesConfig]?: StyleFn };
type StyleState = { isFocused?: boolean; isSelected?: boolean };
type NestedStyle = { backgroundColor?: unknown; borderColor?: unknown } | undefined;

// The --ambari-select-* variables exist only in dark mode, so light mode
// falls back to the react-select default value.
const withVar = (variable: string, value: unknown) =>
  typeof value === "string" ? `var(${variable}, ${value})` : value;

const themeStyles: Record<string, StyleFn> = {
  control: (base, props) => {
    const state = props as StyleState;
    if (state.isFocused) {
      return { ...base, backgroundColor: withVar("--ambari-select-bg", base.backgroundColor) } as CSSObjectWithLabel;
    }
    const hover = base["&:hover"] as NestedStyle;
    return {
      ...base,
      backgroundColor: withVar("--ambari-select-bg", base.backgroundColor),
      borderColor: withVar("--ambari-select-border", base.borderColor),
      ...(hover ? { "&:hover": { ...hover, borderColor: withVar("--ambari-select-border", hover.borderColor) } } : {}),
    } as CSSObjectWithLabel;
  },
  menu: (base) => ({ ...base, backgroundColor: withVar("--ambari-select-bg", base.backgroundColor) }) as CSSObjectWithLabel,
  option: (base, props) => {
    const state = props as StyleState;
    if (state.isSelected) return base;
    const active = base[":active"] as NestedStyle;
    return {
      ...base,
      ...(state.isFocused ? { backgroundColor: withVar("--ambari-select-option-focus-bg", base.backgroundColor) } : {}),
      ...(active ? { ":active": { ...active, backgroundColor: withVar("--ambari-select-option-focus-bg", active.backgroundColor) } } : {}),
    } as CSSObjectWithLabel;
  },
  singleValue: (base) => ({ ...base, color: withVar("--ambari-select-text", base.color) }) as CSSObjectWithLabel,
  input: (base) => ({ ...base, color: withVar("--ambari-select-text", base.color) }) as CSSObjectWithLabel,
  placeholder: (base) => ({ ...base, color: withVar("--ambari-select-placeholder", base.color) }) as CSSObjectWithLabel,
  multiValue: (base) => ({ ...base, backgroundColor: withVar("--ambari-select-multi-bg", base.backgroundColor) }) as CSSObjectWithLabel,
  multiValueLabel: (base) => ({ ...base, color: withVar("--ambari-select-multi-text", base.color) }) as CSSObjectWithLabel,
};

/**
 * Adds theme-aware colors to react-select. Styles passed in are applied on top
 * of the themed base, so existing layout overrides keep working.
 */
export function themedSelectStyles(styles: ThemedSelectStyles = {}): ThemedSelectStyles {
  const merged: Record<string, StyleFn> = { ...themeStyles };
  Object.entries(styles).forEach(([key, style]) => {
    if (!style) return;
    const themed = themeStyles[key];
    merged[key] = themed ? (base, props) => style(themed(base, props), props) : style;
  });
  return merged;
}
