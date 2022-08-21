import { Data } from '@table-library/react-table-library';
import { Column, CompactTable } from '@table-library/react-table-library/compact';
import { useTheme } from '@table-library/react-table-library/theme';
import {
  DEFAULT_OPTIONS,
  getTheme,
} from '@table-library/react-table-library/mantine';

export interface KustoResultTableViewModel {
  columns: Column[];
  data: Data;
}

export function newKustoResultTableViewModel(): KustoResultTableViewModel {
  return {
    columns: [],
    data: { nodes: [] },
  };
}

export interface KustoResultTableProps {
  viewModel: KustoResultTableViewModel;
}

export default function KustoResultTable(props: KustoResultTableProps) {
  const { viewModel } = props;

  const mantineTheme = getTheme(DEFAULT_OPTIONS);
  const theme = useTheme(mantineTheme);

  return (
    <CompactTable
      columns={viewModel.columns}
      data={viewModel.data}
      theme={theme}
    />);
}