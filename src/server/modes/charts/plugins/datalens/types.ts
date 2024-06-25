import type {
    ColorPalette,
    ColumnSettings,
    Palette,
    ParameterDefaultValue,
    PayloadFilter,
    ServerColorsConfig,
    ServerField,
    TableBarsSettings,
    TableFieldBackgroundSettings,
    Update,
} from '../../../../../shared';

export type PayloadParameter = {
    id: string;
    value: ParameterDefaultValue;
};

export type OrderByPayloadItem = {
    direction: string;
    column: string;
};

export type BaseUrlPayload = {
    columns: string[];
    where?: PayloadFilter[];
    order_by?: OrderByPayloadItem[];
    updates?: Update[];
    ignore_nonexistent_filters?: boolean;
    disable_group_by?: boolean;
    limit?: number;
    offset?: number;
    with_totals: boolean;
    parameters?: PayloadParameter[];
};

export type ApiVersion = '1.5' | '2';

export type ServerFieldWithBackgroundSettings = ServerField & {
    backgroundSettings: TableFieldBackgroundSettings;
};

export type ServerFieldWithBarsSettings = ServerField & {
    barsSettings: TableBarsSettings;
};

export type ServerFieldWithColumnWidthSettings = ServerField & {
    columnSettings: ColumnSettings;
};

export type BackendPivotTableCellCustom = {
    // Role needs to make difference between total column/row and any other
    role: 'data' | 'total';
    // Current view direction. It needs for rendering icon and calc next direction
    currentSortDirection: 'asc' | 'desc' | null;
    // Next direction which will be sent to backend
    nextSortDirection: 'asc' | 'desc' | undefined;
    //  path represents the nesting of the column values
    path: string[];
    // needs when sorting table with multiple measures
    // when building request
    measureGuid?: string;
    // needs to compare field order in ui section
    // when building request
    fieldOrder: string[];
};

export interface ChartColorsConfig extends ServerColorsConfig {
    colors: string[];
    gradientColors: string[];
    loadedColorPalettes: Record<string, ColorPalette>;
    availablePalettes: Record<string, Palette>;
}
