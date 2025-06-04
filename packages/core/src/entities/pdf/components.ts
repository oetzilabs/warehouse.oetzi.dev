import {
  Content,
  ContentColumns,
  CustomTableLayout,
  Table as PdfMakeTable,
  TableCell,
  TableLayout,
} from "pdfmake/interfaces";

export const default_styles = {
  header: {
    fontSize: 14,
    bold: true,
    font: "Helvetica",
  },
  subheader: {
    fontSize: 8,
    color: "#555555",
    font: "Helvetica",
  },
  sectionHeader: {
    fontSize: 10,
    bold: true,
    font: "Helvetica",
  },
  normalText: {
    fontSize: 8,
    font: "Helvetica",
    lineHeight: 1.4,
  },
  smallText: {
    fontSize: 7,
    font: "Helvetica",
    lineHeight: 1.4,
  },
  tableHeader: {
    fontSize: 10,
    bold: true,
    font: "Helvetica",
    color: "#495057",
  },
  tableCell: {
    fontSize: 9,
    font: "Helvetica",
    color: "#212529",
  },
  smallHeaderLogo: {
    fontSize: 8,
    font: "Helvetica",
    alignment: "center",
  },
  smallHeaderTitle: {
    fontSize: 10,
    bold: true,
    font: "Helvetica",
  },
  smallHeaderText: {
    fontSize: 8,
    color: "grey",
    font: "Helvetica",
  },
} as const;

type Styles = keyof typeof default_styles;

export const Row = <T>(
  contents: T[],
  config: {
    border?: {
      tuple: [boolean, boolean, boolean, boolean];
      color: [string, string, string, string];
      style: "solid" | "dashed";
    };
  } = {
    border: {
      tuple: [true, false, true, true],
      color: ["#222222", "#222222", "#222222", "#222222"],
      style: "solid",
    },
  },
) => {
  return [
    {
      stack: [...contents].filter(Boolean),
      border: config.border?.tuple ?? [false, false, false, true],
      borderColor: config.border?.color,
    },
  ];
};

export const Text = (
  text: string,
  style: Styles = "normalText",
  config: {
    margin?: [number, number, number, number];
    lineHeight?: number;
    colSpan?: number;
  } = {
    margin: undefined,
    lineHeight: undefined,
    colSpan: undefined,
  },
) => {
  return {
    text,
    style,
    colSpan: config.colSpan,
    ...config,
  };
};
export type BorderConfig = {
  width?: number;
  color?: string;
  style?: "solid" | "dashed";
};

export const getTableLayout = (
  borderConfig: BorderConfig = {
    width: 0.5,
    color: "#222222",
  },
  tc: CustomTableLayout = {
    paddingLeft: (i, node) => 0,
    paddingRight: (i, node) => 0,
    paddingTop: (i, node) => 0,
    paddingBottom: (i, node) => 0,
    fillColor: "#222222",
    fillOpacity: 1,
    defaultBorder: true,
  },
): CustomTableLayout => ({
  hLineWidth: (i, node) => borderConfig.width ?? 0.5,
  vLineWidth: (i, node) => borderConfig.width ?? 0.5,
  hLineColor: (i, node) => borderConfig.color ?? "#222222",
  vLineColor: (i, node) => borderConfig.color ?? "#222222",
  hLineStyle: (i, node) => (borderConfig.style === "dashed" ? { dash: { length: 4 } } : null),
  vLineStyle: (i, node) => (borderConfig.style === "dashed" ? { dash: { length: 4 } } : null),
  defaultBorder: tc.defaultBorder ?? false,
  fillColor: tc.fillColor ?? "#000000",
  fillOpacity: tc.fillOpacity ?? ((i, node) => 0),
  paddingLeft: tc.paddingLeft ?? ((i, node) => 0),
  paddingRight: tc.paddingRight ?? ((i, node) => 0),
  paddingTop: tc.paddingTop ?? ((i, node) => 0),
  paddingBottom: tc.paddingBottom ?? ((i, node) => 0),
});

export const Table = (
  contents: (TableCell | null)[],
  config: {
    widths: PdfMakeTable["widths"];
    border?: BorderConfig;
    layout?: CustomTableLayout;
  } = {
    widths: ["*"],
    border: {
      color: "#222222",
    },
    layout: {
      paddingBottom: (i, node) => 10,
      paddingLeft: (i, node) => 10,
      paddingRight: (i, node) => 10,
      paddingTop: (i, node) => 10,
      defaultBorder: false,
    },
  },
) => {
  const rows = contents.filter(Boolean).map((cell) => (Array.isArray(cell) ? cell : [cell]));
  return {
    table: {
      widths: config.widths,
      body: rows,
    },
    layout: getTableLayout(
      config.border,
      config.layout ?? {
        paddingBottom: (i, node) => 10,
        paddingLeft: (i, node) => 10,
        paddingRight: (i, node) => 10,
        paddingTop: (i, node) => 10,
        defaultBorder: false,
      },
    ),
  };
};

export const Image = (
  data: string,
  size: number,
  config: {
    margin?: [number, number, number, number];
    alignment?: "center" | "left" | "right";
  } = {},
) => {
  const isDataUrl = data.startsWith("data:");
  const isHttpUrl = data.startsWith("http://") || data.startsWith("https://");

  return {
    image: isDataUrl ? data : isHttpUrl ? data : `data:image/png;base64,${data}`,
    width: size,
    fit: [size, size] as [number, number],
    ...config,
  };
};

export const Cell = (
  contents: Content[],
  config: {
    border?: [boolean, boolean, boolean, boolean];
    borderColor?: [string, string, string, string];
  } = {
    border: [true, true, true, true],
    borderColor: ["#222222", "#222222", "#222222", "#222222"],
  },
) => {
  return {
    columns: contents.filter(Boolean),
    ...config,
  } as TableCell;
};

export const placeholderImage =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAAeCAYAAADQBxWhAAAAAXNSR0IArs4c6QAABWBJREFUSEuNV01MU1kU/krLj/wkUH5Kkb+RdkzYOJHNuHKljAksdJyEbiABduOan4EFo4uxJoSFMa5MfNXoKAYTMDILQ2JZDBMpO5nE15YWpOXHMpgWKFjyJue0r32v71W8C3i979z73fOdc757nsHj8UhmsxmFhYUwAJCgGMoJzbPGWrky9ay2OTw8xE5kBwa/3y993t2FzW5HaWmpzkLFFJ2I9vnaSNlkm8ZiMYiiiPLychhCoZBUVFSEYDAI+/d2lBSXqLY8GUeJomMtAXv7ewzY1NyE+EE8CWqttSKyE8H6x4/scXFxsdaXr6LnBt7f32fA+voGVFaaEQ6HCTQsWa21HMxPkU88abPZcOrUKS2vOtTxlGY+OXFwcACv1wfav6qqivfbSIKGJKvVmgbY3t7G5uYmAxPtuYYSTGMjAfHDOLxeLywWC6qrq5MmEhDeUIFKkGDgPNna2gKB2+12FBQUpBeok0jJd2YtGR8dHTGlBFZTU6M6U4rekFRrtWr229zaRCQSYeD8/PwcwMkSkxOanhNfvjBgZWUlLDUWfpmxkRAOb8j01iaXZiULnWp3dxd2mx2mfFP2azWrEpA4TiTLoqIclJyZkQl6Fr0aTF4TCoUQi0bRYrfBmJeXs1CPj485hmVlZairq8uZCxrQVKw19b++HsLeXoypNjCXSkINoIiKH0SUlJTg9OnTGgeVJ0jHVJm9Gs5SAGtra4jH4wycPYhSyvSGhoYcIcjELRNT4l8uNuWOWVmyuhbE4dEX2G22tBVRShne0Nh4okLSom/wVBsakstEIoGWlhb4fD6YTCY0NTXpx1BHTLSgOZRF3lF2PBBYQSwaQ2lZGZqbm3Mkjb5u6nuqr2vpjel1MBBANBrlTNWC6ou+HD5d0JNulWBwFcfHCZz57gz8K34YjUY1vbkwUzqoEAdlIafqVSceq6urLHGky/LwekUUFBSisbExZ21qSoZk+OLFi3j16pXiElcfly7gS5cvYeHvBb723G432trauDzuOJ0YGhri+nz37h3U5ac+Of3aSAp+WHrkEvB+eRmCIOhK18joCJaXlzE1NcWHGx8f5//RaAwORxeePHmCiYkJBAIBTE5OppoevRZDob2E5HA48PTp08xJU4ckGaSkIUrzjEYseTzo6+vD7OwsFhcX8eLFCz4seTk8PIz79+/rCojsDSdSOBSSJAPg6HLgt+FhDAwO8oZE0+jIKA7icTidt7keaTidTn5Pnt67d48ZEISH8HiW0Nvbi7t37zKoTHN2XqWz95HLhd9v3oTbPY9waJ2pPn++Dbdv/8GeVFRUMGBPTw9cLhemp6fR2dkJp/MO/l1+j4eCwErT5XDgkeBCbC+mutq0iWSAdOPXG5ifn8eDBw9w9uxZtLe3Y2lpCXNzc/jxwgWVvNEtceWnK2z75s2blKcCdwTEFoWIWlqSR77Eq2tUHWTaU4obxemv2VkYTSY8e/Ynnj+fxOvXrzMZreCJPG5tbWUHkvQK8ChiTdRS1+f1ibBYajPtilJ7KSEoIwXBBZ/Pi7GxMZw79wPaL19CR2enpv4I9Pov17mg5UQi0Fu3buHx48fpgyYbMy+oM6lONWbsqSiKUn9/P6hWr/18DTPTM9yedHd3pzOa4kgcDQ4OsEdXr17Fy5cv+bKWs55sZK+V91umBa3nOLMiUVF1ObowODAAUfRyRspCMTMzw57QXEdHB96+dXMNyokkZzOJAynSwj8LWW1KUt32qdn+ILJc0p1s8PtXpM+7/6k/K04SYJX8q7sIVSwU+9CtJHpTnxWeRY9krjSjqLAQVK/0J9mA0Pi2j6SM/dfllz+gdnbwP3BGCEixd7+qAAAAAElFTkSuQmCC" as const;
