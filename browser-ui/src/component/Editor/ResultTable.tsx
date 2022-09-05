import classNames from 'classnames';
import Table from 'rc-table';
import { ColumnType, DefaultRecordType } from 'rc-table/lib/interface';
import { useEffect, useState } from 'react';
import { Resizable, ResizableProps, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { ResultTableColumn, ResultTableViewModel } from './viewModel';

interface ResizableTableTitleProps {
  onResize: ResizableProps['onResize'];
  width?: number;
  className?: string;
  maxConstraints: ResizableProps['maxConstraints'];
}

function ResizableTableTitle(props: ResizableTableTitleProps) {
  const { onResize, maxConstraints, width, className, ...restProps } = props;

  const headerClassName = classNames(className, 'text-left');

  if (!width) {
    return (
      <th {...restProps} className={headerClassName} />
    );
  }

  return (
    <Resizable
      width={width}
      height={0}
      onResize={onResize}
      maxConstraints={maxConstraints}
      axis="x"
    >
      <th {...restProps} className={headerClassName} />
    </Resizable>
  );
}

function ResultTableElem(props: {
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

  const tableColumns = columns.map((column, idx) => {
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

  const tableComponents = {
    header: {
      cell: ResizableTableTitle,
    },
    table: ResultTableElem,
  };

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