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

import { fireEvent, render, screen } from "@testing-library/react";
import { get } from "lodash";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "../components/ThemeToggle";
import { ThemeProvider } from "../store/ThemeContext";
import PrometheusChart from "../screens/Monitoring/PrometheusChart";
import BarChartRenderer from "../screens/Monitoring/Dashboard/renderers/BarChartRenderer";
import PieRenderer from "../screens/Monitoring/Dashboard/renderers/PieRenderer";
import type { DashboardPanel } from "../screens/Monitoring/types";
import type { DashboardPanelResult } from "../screens/Monitoring/Dashboard/data/panelData";

type ChartProps = { data: unknown; options: unknown };

const charts = vi.hoisted(() => ({ renders: [] as ChartProps[], mounts: 0 }));

vi.mock("react-chartjs-2", async () => {
  const { useEffect } = await import("react");
  const Chart = (props: ChartProps) => {
    charts.renders.push(props);
    useEffect(() => {
      charts.mounts += 1;
    }, []);
    return <canvas />;
  };
  return { Line: Chart, Bar: Chart, Pie: Chart, Doughnut: Chart };
});

const lastChart = () => charts.renders[charts.renders.length - 1];
const option = (path: string) => get(lastChart().options, path);

const results: DashboardPanelResult[] = [{
  metric: { __name__: "cpu", host: "c7401" },
  values: [[1700000000, "1"], [1700000060, "2"]],
  displayName: "cpu",
  seriesKey: "cpu-c7401",
  targetRefId: "A",
  targetName: "A",
}];

const panel = (type: string) => ({
  id: "panel-1",
  name: "CPU",
  type,
  targets: [],
  layout: { x: 0, y: 0, w: 6, h: 4, i: "panel-1" },
}) as unknown as DashboardPanel;

const renderThemed = (chart: ReactNode) => render(
  <ThemeProvider>
    <ThemeToggle />
    {chart}
  </ThemeProvider>,
);

const switchToDark = () => fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

describe("chart theme colors", () => {
  beforeEach(() => {
    charts.renders = [];
    charts.mounts = 0;
  });

  afterEach(() => {
    document.documentElement.removeAttribute("data-bs-theme");
  });

  it.each(["lines", "bars"])("keeps Chart.js defaults in light mode and updates %s charts in place", (drawStyle) => {
    renderThemed(<PrometheusChart results={results} drawStyle={drawStyle} />);

    expect(option("scales.x.ticks.color")).toBeUndefined();
    expect(option("scales.x.grid")).toBeUndefined();
    expect(option("scales.y.border")).toBeUndefined();
    expect(option("plugins.legend.labels")).toEqual({ boxWidth: 12 });
    const lightData = lastChart().data;

    switchToDark();

    expect(option("scales.x.ticks.color")).toBe("#c3c9d1");
    expect(option("scales.y.ticks.color")).toBe("#c3c9d1");
    expect(option("scales.x.grid.color")).toBe("rgba(255, 255, 255, 0.12)");
    expect(option("scales.y.border.color")).toBe("rgba(255, 255, 255, 0.12)");
    expect(option("plugins.legend.labels")).toEqual({ boxWidth: 12, color: "#c3c9d1" });
    expect(typeof option("scales.y.ticks.callback")).toBe("function");
    expect(lastChart().data).toEqual(lightData);
    expect(charts.mounts).toBe(1);
  });

  it("themes bar chart panel axes without changing series colors", () => {
    renderThemed(<BarChartRenderer panel={panel("barchart")} results={results} />);
    const seriesColors = get(lastChart().data, "datasets[0].backgroundColor");
    expect(option("scales.x.ticks.color")).toBeUndefined();

    switchToDark();

    expect(option("scales.x.ticks.color")).toBe("#c3c9d1");
    expect(option("scales.y.grid.color")).toBe("rgba(255, 255, 255, 0.12)");
    expect(get(lastChart().data, "datasets[0].backgroundColor")).toEqual(seriesColors);
    expect(charts.mounts).toBe(1);
  });

  it("themes pie legend and slice borders only in dark mode", () => {
    renderThemed(<PieRenderer panel={panel("pie")} results={results} />);
    expect(get(lastChart().data, "datasets[0].borderColor")).toBeUndefined();
    expect(option("plugins.legend.labels")).toBeUndefined();

    switchToDark();

    expect(get(lastChart().data, "datasets[0].borderColor")).toBe("#2b3240");
    expect(option("plugins.legend.labels.color")).toBe("#c3c9d1");
    expect(get(lastChart().data, "datasets[0].backgroundColor")).toEqual(["#278541"]);
    expect(charts.mounts).toBe(1);
  });
});
