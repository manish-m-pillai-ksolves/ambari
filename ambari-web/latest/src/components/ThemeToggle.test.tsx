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

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "./ThemeToggle";
import { ThemeProvider } from "../store/ThemeContext";
import { THEME_STORAGE_KEY } from "../Utils/theme";

const currentTheme = () => document.documentElement.getAttribute("data-bs-theme");

const renderToggle = () => render(
  <ThemeProvider>
    <input aria-label="unsaved input" />
    <ThemeToggle />
  </ThemeProvider>,
);

describe("ThemeToggle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("data-bs-theme");
  });

  it("starts in light mode with a moon icon for first-time users", () => {
    const { container } = renderToggle();

    const button = screen.getByRole("button", { name: "Switch to dark mode" });
    expect(button.getAttribute("title")).toBe("Switch to dark mode");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelector('svg[data-icon="moon"]')).not.toBeNull();
    expect(currentTheme()).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("switches the whole document without a reload and saves the choice", () => {
    const { container } = renderToggle();
    const input = screen.getByLabelText("unsaved input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "draft" } });
    const button = screen.getByRole("button", { name: "Switch to dark mode" });

    fireEvent.click(button);

    expect(currentTheme()).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(button.getAttribute("aria-label")).toBe("Switch to light mode");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('svg[data-icon="sun"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBe(button);
    expect(input.value).toBe("draft");

    fireEvent.click(button);

    expect(currentTheme()).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(container.querySelector('svg[data-icon="moon"]')).not.toBeNull();
  });

  it("applies a stored dark theme on start", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const { container } = renderToggle();

    expect(currentTheme()).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeTruthy();
    expect(container.querySelector('svg[data-icon="sun"]')).not.toBeNull();
  });

  it("falls back to light when the stored value is invalid", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    renderToggle();

    expect(currentTheme()).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeTruthy();
  });

  it("still switches when the choice cannot be saved", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    renderToggle();

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(currentTheme()).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeTruthy();
  });

  it("follows theme changes made in another tab", () => {
    renderToggle();

    act(() => {
      localStorage.setItem(THEME_STORAGE_KEY, "dark");
      window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY, newValue: "dark" }));
    });
    expect(currentTheme()).toBe("dark");

    act(() => {
      localStorage.setItem("i18nextLng", "zh");
      window.dispatchEvent(new StorageEvent("storage", { key: "i18nextLng", newValue: "zh" }));
    });
    expect(currentTheme()).toBe("dark");

    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });
    expect(currentTheme()).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeTruthy();
  });
});
