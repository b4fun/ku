import Table from 'rc-table';
import { ColumnType, DefaultRecordType } from 'rc-table/lib/interface';
import { useEffect, useState } from 'react';
import { Resizable, ResizableProps, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { ResultTableColumn, ResultTableViewModel } from './viewModel';

interface ResizableTableTitleProps {
  onResize: ResizableProps['onResize'];
  width?: number;
}

function ResizableTableTitle(props: ResizableTableTitleProps) {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return (
      <th {...restProps} />
    );
  }

  return (
    <Resizable width={width} height={0} onResize={onResize}>
      <th {...restProps} />
    </Resizable>
  );
}

export interface ResultTableProps {
  viewModel: ResultTableViewModel;
}

export default function ResultTable(props: ResultTableProps) {
  const { viewModel } = props;

  const [columns, setColumns] = useState<ResultTableColumn[]>(viewModel.columns);

  useEffect(() => {
    setColumns(viewModel.columns.map(column => {
      return {
        ...column,
        width: column.width || 100,
      };
    }));
  }, [viewModel.columns]);

  const tableColumns = columns.map((column, idx) => {
    return {
      ...column,
      onHeaderCell: (column: ColumnType<DefaultRecordType>) => ({
        width: column.width || 350,
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
      })
    };
  });

  const tableComponents = {
    header: {
      cell: ResizableTableTitle,
    }
  };

  return (
    <Table
      components={tableComponents}
      columns={tableColumns}
      data={viewModel.data}
    />);
}