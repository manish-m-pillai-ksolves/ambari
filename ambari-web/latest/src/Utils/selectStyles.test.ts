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

import type { CSSObjectWithLabel } from "react-select";
import { describe, expect, it, vi } from "vitest";
import { themedSelectStyles } from "./selectStyles";

const css = (value: object) => value as CSSObjectWithLabel;

describe("themedSelectStyles", () => {
  it("keeps the react-select default as the fallback of each dark variable", () => {
    const styles = themedSelectStyles();
    const control = styles.control!(css({
      backgroundColor: "hsl(0, 0%, 100%)",
      borderColor: "hsl(0, 0%, 80%)",
      minHeight: 38,
      "&:hover": { borderColor: "hsl(0, 0%, 70%)" },
    }), { isFocused: false });

    expect(control).toEqual({
      backgroundColor: "var(--ambari-select-bg, hsl(0, 0%, 100%))",
      borderColor: "var(--ambari-select-border, hsl(0, 0%, 80%))",
      minHeight: 38,
      "&:hover": { borderColor: "var(--ambari-select-border, hsl(0, 0%, 70%))" },
    });
    expect(styles.singleValue!(css({ color: "hsl(0, 0%, 20%)" }), {})).toEqual({
      color: "var(--ambari-select-text, hsl(0, 0%, 20%))",
    });
    expect(styles.menu!(css({ backgroundColor: "hsl(0, 0%, 100%)" }), {})).toEqual({
      backgroundColor: "var(--ambari-select-bg, hsl(0, 0%, 100%))",
    });
  });

  it("keeps the focus border and selected option colors", () => {
    const styles = themedSelectStyles();
    const focused = styles.control!(css({ backgroundColor: "white", borderColor: "#2684FF" }), { isFocused: true });
    expect(focused.borderColor).toBe("#2684FF");

    const selected = css({ backgroundColor: "#2684FF", color: "white" });
    expect(styles.option!(selected, { isSelected: true, isFocused: true })).toBe(selected);

    const option = styles.option!(css({
      backgroundColor: "#DEEBFF",
      ":active": { backgroundColor: "#B2D4FF" },
    }), { isSelected: false, isFocused: true });
    expect(option).toEqual({
      backgroundColor: "var(--ambari-select-option-focus-bg, #DEEBFF)",
      ":active": { backgroundColor: "var(--ambari-select-option-focus-bg, #B2D4FF)" },
    });
  });

  it("leaves missing or non-string values unchanged", () => {
    const styles = themedSelectStyles();
    expect(styles.input!(css({ margin: 2 }), {})).toEqual({ margin: 2, color: undefined });
    expect(styles.option!(css({ backgroundColor: "transparent" }), { isFocused: false })).toEqual({
      backgroundColor: "transparent",
    });
  });

  it("applies existing styles on top of the themed base", () => {
    const control = vi.fn((base: CSSObjectWithLabel) => ({ ...base, minHeight: "30px" }));
    const menuPortal = (base: CSSObjectWithLabel) => ({ ...base, zIndex: 9999 });
    const styles = themedSelectStyles({ control, menuPortal });
    const props = { isFocused: false };

    const result = styles.control!(css({ backgroundColor: "white", borderColor: "grey" }), props);

    expect(control).toHaveBeenCalledWith(
      { backgroundColor: "var(--ambari-select-bg, white)", borderColor: "var(--ambari-select-border, grey)" },
      props,
    );
    expect(result.minHeight).toBe("30px");
    expect(styles.menuPortal!(css({ position: "fixed" }), {})).toEqual({ position: "fixed", zIndex: 9999 });
  });
});
