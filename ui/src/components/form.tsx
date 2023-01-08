import { Button, ButtonProps, createStyles } from '@mantine/core';
import { themeColors } from '../settings';

const useStyles = createStyles((theme) => {
  return {
    submitButton: {
      // hack: https://github.com/tailwindlabs/tailwindcss/issues/6602
      backgroundColor: `${themeColors.orange} !important`,
      color: theme.white,
      '&:hover': {
        backgroundColor: `${themeColors.orangeLight} !important`,
      },
    },
  };
});

export function SubmitButton(props: ButtonProps) {
  const { disabled, children } = props;
  const { classes, cx } = useStyles();

  return (
    <Button {...props} className={cx(props.className, { [classes.submitButton]: !disabled })}>
      {children}
    </Button>
  );
}
