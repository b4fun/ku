import Table from 'rc-table';
import { ColumnType, DefaultRecordType } from 'rc-table/lib/interface';

export interface ResultTableViewModel {
  columns: ColumnType<DefaultRecordType>[];
  data: DefaultRecordType[];
}

export function newResultTableViewModel(): ResultTableViewModel {
  return {
    columns: [],
    data: [],
  };
}

export interface ResultTableProps {
  viewModel: ResultTableViewModel;
}

export default function ResultTable(props: ResultTableProps) {
  const { viewModel } = props;

  return (
    <Table
      columns={viewModel.columns}
      data={viewModel.data}
    />);
}