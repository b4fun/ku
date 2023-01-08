import { createStyles } from '@mantine/core';
import { remSpacing } from '../../settings';

export default createStyles((theme) => {
  const borderStyle = '1px solid rgb(229, 231, 235)';

  return {
    titleCellHeader: {
      textAlign: 'left',
    },
    titleCellContent: {
      paddingLeft: remSpacing.s5,
      paddingRight: remSpacing.s5,
      paddingTop: remSpacing.s2,
      paddingBottom: remSpacing.s2,
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: '1.5rem',
      borderRight: borderStyle,
    },
    titleCellContentWithWidth: {
      marginRight: '-8px',
    },
    titleRow: {
      borderBottom: borderStyle,
    },

    cell: {
      textAlign: 'left',
    },
    cellContent: {
      paddingLeft: remSpacing.s5,
      paddingRight: remSpacing.s5,
      paddingTop: remSpacing.s2,
      paddingBottom: remSpacing.s2,
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: '1.5rem',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    cellRow: {
      borderBottom: borderStyle,
    },

    table: {
      width: '100%',
      border: '0px solid transparent',
    },

    tableWrapper: {
      width: '100%',
      height: '100%',
      overflow: 'scroll',
    },
  };
});
