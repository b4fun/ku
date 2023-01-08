const themeColors = {
  orange: '#d9480f',
  orangeLight: '#e06c3e',
};

const remSpacing: Record<string, string> = [
  0,1,2,3,4,5,6,7,8,9,10
].reduce((acc, n) => {
  return {
    ...acc,
    [`s${n}`]: `${n * 0.25}rem`,
  };
}, {
  sm: '0.875rem',
});

export { themeColors, remSpacing };