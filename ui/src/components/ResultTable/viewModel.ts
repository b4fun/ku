import { ColumnType, DefaultRecordType } from 'rc-table/lib/interface';

export type ResultTableColumn = ColumnType<DefaultRecordType>;

export interface ResultTableViewModel {
  columns: ResultTableColumn[];
  data: DefaultRecordType[];
}
