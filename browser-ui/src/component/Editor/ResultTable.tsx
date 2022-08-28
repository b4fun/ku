import Table from 'rc-table';
import { ResultTableViewModel } from './viewModel';

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