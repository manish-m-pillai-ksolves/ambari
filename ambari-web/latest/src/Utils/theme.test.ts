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

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  getStoredTheme,
  setStoredTheme,
  THEME_STORAGE_KEY,
} from "./theme";

describe("theme storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-bs-theme");
  });

  it("defaults to light when nothing is stored", () => {
    expect(getStoredTheme()).toBe("light");
  });

  it("returns a stored dark theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(getStoredTheme()).toBe("dark");
  });

  it.each(["", "Dark", "blue", "null", "{\"theme\":\"dark\"}"])(
    "falls back to light for the invalid value %j",
    (value) => {
      localStorage.setItem(THEME_STORAGE_KEY, value);
      expect(getStoredTheme()).toBe("light");
    },
  );

  it("falls back to light when storage cannot be read", () => {
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(getStoredTheme()).toBe("light");
  });

  it("stores the choice as plain text under the theme key", () => {
    setStoredTheme("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    setStoredTheme("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("does not throw when storage cannot be written", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => setStoredTheme("dark")).not.toThrow();
  });

  it("applies the theme to the document element", () => {
    applyTheme("dark");
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-bs-theme")).toBe("light");
  });
});
