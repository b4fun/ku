import Editor from '@monaco-editor/react';
import classNames from 'classnames';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import Table from 'rc-table';
import { ColumnType, DefaultRecordType, ExpandableConfig, TableComponents } from 'rc-table/lib/interface';
import { useEffect, useState } from 'react';
import { Resizable, ResizableProps, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { ResultTableColumn, ResultTableViewModel } from './viewModel';

interface ResultTableTitleCellProps {
  onResize: ResizableProps['onResize'];
  width?: number;
  className?: string;
  maxConstraints: ResizableProps['maxConstraints'];
}

function ResultTableTitleCell(props: React.PropsWithChildren<ResultTableTitleCellProps>) {
  const {
    onResize,
    maxConstraints,
    width,
    className,
    children,
    ...restProps
  } = props;

  const headerClassName = classNames(className, 'text-left');
  const contentElemClassName = classNames(
    'px-5 py-2 font-normal text-base border-r-[1px]',
    {
      // for resize handler
      'mr-[-8px]': !!width,
    },
  );

  const contentElem = (
    <div className={contentElemClassName}>
      {children}
    </div>
  );

  if (!width) {
    return (
      <th {...restProps} className={headerClassName}>
        {contentElem}
      </th>
    );
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      maxConstraints={maxConstraints}
      axis="x"
      resizeHandles={['e']}
    >
      <th {...restProps} className={headerClassName}>
        {contentElem}
      </th>
    </Resizable>
  );
}

function ResultTableTitleRow(props: {
  className?: string;
}) {
  const { className, ...restProps } = props;

  const titleRowClassName = classNames(className, 'border-b-[1px]');

  return (
    <tr {...restProps} className={titleRowClassName} />
  );
}

interface ResultTableCellProps {
  className?: string;
  maxWidth: number;
  isData: boolean;
}

function ResultTableCell(props: React.PropsWithChildren<ResultTableCellProps>) {
  const { maxWidth, className, isData, children, ...restProps } = props;

  const cellClassName = classNames(className, 'text-left');

  if (!isData) {
    return (
      <td {...restProps} className={cellClassName}>
        {children}
      </td>
    );
  }

  const contentElemClassName = classNames(
    'px-5 py-2 font-normal text-base',
    'text-ellipsis', 'whitespace-nowrap', 'overflow-hidden',
  );

  return (
    <td {...restProps} className={cellClassName}>
      <div className={contentElemClassName} style={{ maxWidth }}>
        {children}
      </div>
    </td>
  );
}

function ResultTableCellRow(props: {
  className?: string;
}) {
  const { className, ...restProps } = props;

  const cellRowClassName = classNames(className, 'border-b-[1px]');

  return (
    <tr {...restProps} className={cellRowClassName} />
  );
}

function ResultTableTable(props: {
  className?: string;
}) {
  const { className, ...restProps } = props;

  const tableClassName = classNames(className, 'w-full');

  return <table {...restProps} className={tableClassName} />
}

// expandColumnIndexAll sets a special value to indicate that all columns will be expanded
const expandColumnIndexAll = -1;

interface ResultTableExpandedEditorProps {
  value: string;
}

function ResultTableExpandedEditor(props: ResultTableExpandedEditorProps) {
  const { value } = props;
  const [editorHeight, setEditorHeight] = useState(100);

  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    fontSize: 14,
    readOnly: true,
    wordWrap: 'on',
    minimap: { enabled: false },
  };

  return (
    <Resizable
      width={0}
      height={editorHeight}
      axis="y"
      resizeHandles={['s']}
      onResize={(e: React.SyntheticEvent, resizeData: ResizeCallbackData) => {
        if (resizeData.size.height) {
          setEditorHeight(resizeData.size.height);
        }
      }}
    >
      <div style={{ height: editorHeight }}>
        <Editor
          language='json'
          value={value}
          options={editorOptions}
        />
      </div>
    </Resizable>
  );
}

export interface ResultTableProps {
  viewWidth: number;
  viewModel: ResultTableViewModel;
}

export default function ResultTable(props: ResultTableProps) {
  const { viewWidth, viewModel } = props;

  const [columns, setColumns] = useState<ResultTableColumn[]>(() => viewModel.columns);

  useEffect(() => {
    // divide evenly on initial load
    // TODO(hbc): calculate based on the value size
    const suggestedColumnWidth = (viewWidth / viewModel.columns.length) || 100;

    setColumns(viewModel.columns.map(column => {
      return {
        ...column,
        width: column.width || suggestedColumnWidth,
      };
    }));
  }, [viewModel.columns]);

  const [expandedColumnIdx, setExpandedColumnIdx] = useState(0);
  const [expandedRowIdx, setExpandedRowIdx] = useState<number | undefined>(undefined);

  // reset expand state on data reload
  useEffect(() => {
    setExpandedColumnIdx(0);
    setExpandedRowIdx(undefined);
  }, [viewModel]);

  const tableColumns: ColumnType<DefaultRecordType>[] = columns.map((column, colIdx) => {
    return {
      ...column,
      onHeaderCell: (column: ColumnType<DefaultRecordType>) => ({
        width: column.width,
        maxConstraints: [viewWidth, Infinity],
        onResize: (e: React.SyntheticEvent, resizeData: ResizeCallbackData) => {
          setColumns(prevColumns => {
            const nextColumns = [...prevColumns];

            nextColumns[colIdx] = {
              ...nextColumns[colIdx],
              width: resizeData.size.width,
            };

            return nextColumns;
          });
        },
      }),
      onCell: (data: DefaultRecordType, rowIdx?: number) => {
        const rv = {
          ...data,
          onClick: () => {
            setExpandedColumnIdx(colIdx);
            setExpandedRowIdx(rowIdx);
          },

          // ref: ResultTableCellProps
          isData: true,
          maxWidth: columns[colIdx].width,
        }

        // FIXME: force casting to allow passing maxWidth to cell
        return rv as React.HTMLAttributes<DefaultRecordType>;
      },
    };
  });

  const tableComponents: TableComponents<DefaultRecordType> = {
    header: {
      cell: ResultTableTitleCell,
    },
    body: {
      cell: ResultTableCell,
      row: ResultTableCellRow,
    },
    table: ResultTableTable,
  };

  if (viewModel.data.length > 0) {
    tableComponents.header!.row = ResultTableTitleRow;
  }

  const tableWidth = tableColumns.reduce((acc, column) => {
    if (typeof column.width !== 'number') {
      return acc;
    }

    return acc + column.width;
  }, 0);

  const tableExpand: ExpandableConfig<DefaultRecordType> = {
    expandRowByClick: false,
    showExpandColumn: false,
    expandedRowRender: (record, rowIndex, indent, expanded) => {
      if (!expanded) {
        return (<></>);
      }

      const values: string[] = [];

      if (expandedColumnIdx === expandColumnIndexAll) {
        columns.forEach(column => {
          if (column.key) {
            values.push(`"${column.key}": ${record[column.key]}`);
          } else {
            values.push('');
          }
        });
      } else if (expandedColumnIdx >= 0 && expandedColumnIdx < columns.length) {
        const selectedColumn = columns[expandedColumnIdx];
        if (selectedColumn.key) {
          values.push(record[selectedColumn.key]);
        } else {
          values.push('');
        }
      }

      return (<ResultTableExpandedEditor value={values.join('\n')} />);
    },
  };
  if (expandedRowIdx !== undefined) {
    tableExpand.expandedRowKeys = [`${expandedRowIdx}`];
  }

  return (
    <div className='w-full h-full overflow-scroll'>
      <Table
        tableLayout='auto'
        components={tableComponents}
        columns={[
          {
            width: 0, // set it to non-resizable
            onCell: (data: DefaultRecordType, rowIdx?: number) => {
              return {
                ...data,
                onClick: () => {
                  setExpandedColumnIdx(expandColumnIndexAll);
                  setExpandedRowIdx(rowIdx);
                },
              };
            }
          },
          ...tableColumns,
          {
            width: 0,
            onCell: (data: DefaultRecordType, rowIdx?: number) => {
              return {
                ...data,
                onClick: () => {
                  setExpandedColumnIdx(expandColumnIndexAll);
                  setExpandedRowIdx(rowIdx);
                },
              };
            },
          },
        ]}
        data={viewModel.data}
        style={{
          width: Math.max(tableWidth, viewWidth),
          height: '100%',
        }}
        expandable={tableExpand}
        emptyText={() => (<></>)}
      />
    </div>
  );
}