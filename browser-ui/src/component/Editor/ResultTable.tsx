import classNames from 'classnames';
import Table from 'rc-table';
import { ColumnType, DefaultRecordType, TableComponents } from 'rc-table/lib/interface';
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

function ResultTableTable(props: {
  className?: string;
}) {
  const { className, ...restProps } = props;

  const tableClassName = classNames(className, 'w-full');

  return <table {...restProps} className={tableClassName} />
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

  const tableColumns: ColumnType<DefaultRecordType>[] = columns.map((column, idx) => {
    return {
      ...column,
      onHeaderCell: (column: ColumnType<DefaultRecordType>) => ({
        width: column.width,
        maxConstraints: [viewWidth, Infinity],
        onResize: (e: React.SyntheticEvent, resizeData: ResizeCallbackData) => {
          setColumns(prevColumns => {
            const nextColumns = [...prevColumns];

            nextColumns[idx] = {
              ...nextColumns[idx],
              width: resizeData.size.width,
            };

            return nextColumns;
          });
        },
      }),
      onCell: (data: DefaultRecordType) => {
        return {
          ...data,
          style: {
            ...data.style,
            maxWidth: columns[idx].width,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          },
        };
      },
    };
  });
  tableColumns.push({});

  const tableComponents: TableComponents<DefaultRecordType> = {
    header: {
      cell: ResultTableTitleCell,
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

  return (
    <div className='w-full h-full overflow-scroll'>
      <Table
        tableLayout='auto'
        components={tableComponents}
        columns={tableColumns}
        data={viewModel.data}
        style={{
          width: Math.max(tableWidth, viewWidth),
          height: '100%',
        }}
      />
    </div>
  );
}