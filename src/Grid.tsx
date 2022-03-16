import {
  ColDef,
  ColGroupDef,
  ExportParams,
  GridApi,
  RowNode,
  SideBarDef,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useEffect, useMemo, useState, VFC } from 'react';
import { DataItem } from './types';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';
import { useDataUpdate } from './queries';
import { LabelCellEditor, LabelCellRenderer } from './LabelCell';
import { ActionsCellRenderer } from './ActionsCell';
import { DateTime } from 'luxon';
import { useDragRows } from './useDragRows';
import { useIsFetching } from 'react-query';

const sideBar: SideBarDef = {
  toolPanels: [
    {
      id: 'filters',
      labelDefault: 'Filters',
      labelKey: 'filters',
      iconKey: 'filter',
      toolPanel: 'agFiltersToolPanel',
      toolPanelParams: {
        suppressFilterSearch: true,
      },
    },
    {
      id: 'columns',
      labelDefault: 'Columns',
      labelKey: 'columns',
      iconKey: 'columns',
      toolPanel: 'agColumnsToolPanel',
      toolPanelParams: {
        suppressRowGroups: true,
        suppressValues: true,
        suppressPivots: true,
        suppressPivotMode: true,
        suppressColumnFilter: true,
      },
    },
  ],
  position: 'left',
};

export const getDefaultExportParams = (
  dateTime?: DateTime
): ExportParams<undefined> => ({
  columnKeys: ['label', 'id', 'tags', 'description'],
  processCellCallback: (params) => {
    const { value } = params;

    return value;
  },
  fileName: `segment-admin-export-${
    dateTime?.toFormat(`yyMMdd-HH:mm:ss`) || DateTime.local().toFormat(`yyMMdd`)
  }`,
});

export const Grid: VFC<{
  data: DataItem[] | undefined;
  search: string;
  readonly?: boolean;
  onAction: () => void;
}> = ({ data, search, readonly = false, onAction }) => {
  const { mutateAsync } = useDataUpdate();

  const isFetching = useIsFetching();

  const columnDefs = useMemo<Array<ColDef | ColGroupDef>>(
    () => [
      {
        field: 'id',
        getQuickFilterText: (params) => `id:(${params.value})`,
      },
      {
        field: 'type',
      },
      {
        field: 'source',
      },
      {
        field: 'count',
      },
      {
        field: 'description',
        editable: true,
      },
      {
        fileld: 'longDescription',
      },
      {
        field: 'label',
        hide: true,
        lockVisible: true,
        suppressColumnsToolPanel: true,
      },
      {
        field: 'location',
        hide: true,
        lockVisible: true,
        suppressFiltersToolPanel: true,
        suppressColumnsToolPanel: true,
      },
      {
        hide: readonly,
        field: 'actions',
        filter: false,
        sortable: false,
        resizable: false,
        flex: undefined,
        pinned: 'right',
        width: 100,
        menuTabs: [],
        cellStyle: {
          padding: '0.4rem',
        },
        cellRenderer: ActionsCellRenderer,
        cellRendererParams: {
          onAction,
        },
      },
    ],
    [readonly, onAction]
  );

  const autoColumnDef = useMemo<ColDef>(
    () => ({
      headerName: 'Label',
      cellRendererParams: {
        suppressCount: true,
        innerRenderer: LabelCellRenderer,
      },
      valueFormatter: (params) => params.data.label,
      rowDrag: true,
      rowDragText: ({ rowNode }) => rowNode?.data.label,
      filter: true,
      menuTabs: ['filterMenuTab', 'generalMenuTab'],
      headerCheckboxSelection: !readonly,
      headerCheckboxSelectionFilteredOnly: true,
      resizable: true,
      getQuickFilterText(params) {
        return params.data.label;
      },
      filterParams: {
        valueGetter: (row: RowNode) => (row.data as DataItem).label,
      },
      cellEditor: LabelCellEditor,
      valueSetter(params) {
        params.data.label = params.newValue;
        return true;
      },
      flex: 2,
    }),
    [readonly]
  );

  const [api, setApi] = useState<GridApi>();
  const [selection, setSelection] = useState<RowNode[]>();

  useEffect(() => {
    if (isFetching) {
      api?.showLoadingOverlay();
    } else {
      api?.hideOverlay();
    }
  }, [api, isFetching]);

  const {
    onRowDragStart,
    onRowDragMove,
    onRowDragEnd,
    isRowDropInto,
    isRowDropAfter,
    isRowDropBefore,
    onRowDragLeave,
  } = useDragRows(api);

  return (
    <div className="ag-theme-alpine">
      <AgGridReact
        quickFilterText={search}
        cacheQuickFilter={true}
        rowData={data}
        sideBar={sideBar}
        enableRangeSelection={true}
        enableFillHandle={true}
        rowSelection="multiple"
        treeData={true}
        getDataPath={(row) => row.path}
        immutableData={true}
        getRowId={(params) => params.data.id}
        onCellEditingStopped={async () => {
          await mutateAsync();
        }}
        suppressClickEdit={readonly}
        suppressCellSelection={readonly}
        columnDefs={columnDefs}
        autoGroupColumnDef={autoColumnDef}
        onRowDragEnter={onRowDragStart}
        onRowDragMove={onRowDragMove}
        onRowDragEnd={onRowDragEnd}
        onRowDragLeave={onRowDragLeave}
        rowClassRules={{
          'row-drop-above': isRowDropBefore,
          'row-drop-into': isRowDropInto,
          'row-drop-below': isRowDropAfter,
        }}
        defaultColDef={{
          flex: 1,
          filter: true,
          sortable: true,
          resizable: true,
        }}
        onGridReady={(e) => {
          setApi(e.api);
        }}
        onSelectionChanged={(e) => setSelection(e.api.getSelectedNodes())}
        onRowDataUpdated={(e) => {
          e.api.redrawRows();
        }}
        defaultCsvExportParams={getDefaultExportParams()}
        defaultExcelExportParams={getDefaultExportParams()}
        overlayLoadingTemplate={`<div>Loading...</div>`}
        getContextMenuItems={(params) => {
          return (params.defaultItems || []).map((item) =>
            item === 'export'
              ? {
                  name: 'Export',
                  icon: `<span class="ag-icon ag-icon-save"></span>`,
                  subMenu: [
                    {
                      name: 'CSV Export',
                      action: () => {
                        const dateTimeNow = DateTime.local();
                        api?.exportDataAsCsv(
                          getDefaultExportParams(dateTimeNow)
                        );
                      },
                      icon: `<span class="ag-icon ag-icon-csv"></span>`,
                    },
                    {
                      name: 'Excel Export',
                      action: () => {
                        const dateTimeNow = DateTime.local();
                        api?.exportDataAsExcel(
                          getDefaultExportParams(dateTimeNow)
                        );
                      },
                      icon: `<span class="ag-icon ag-icon-excel"></span>`,
                    },
                  ],
                }
              : item
          );
        }}
      />
    </div>
  );
};
