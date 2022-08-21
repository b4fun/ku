import Table from 'rc-table';
import { ColumnType, DefaultRecordType } from 'rc-table/lib/interface';

export interface KustoResultTableViewModel {
  columns: ColumnType<DefaultRecordType>[];
  data: DefaultRecordType[];
}

export function newKustoResultTableViewModel(): KustoResultTableViewModel {
  return {
    columns: [],
    data: [],
  };
}

export interface KustoResultTableProps {
  viewModel: KustoResultTableViewModel;
}

export default function KustoResultTable(props: KustoResultTableProps) {
  const { viewModel } = props;

  return (
    <Table
      columns={viewModel.columns}
      data={viewModel.data}
    />);
}