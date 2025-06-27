import * as React from 'react';

const originalCreateElement = React.createElement;

/*React.createElement = function (type, ...rest) {
  const isInvalidObject =
    typeof type === 'object' &&
    type !== null &&
    '$$typeof' in type;

  if (isInvalidObject) {
    console.error('🧨 React.createElement received a React element object instead of a type:', type);
    throw new Error('💥 Invalid React.createElement usage — likely misuse of <Component />');
  }

  return originalCreateElement.call(React, type, ...rest);
};

console.log('👁️ React.createElement trap activated.');*/