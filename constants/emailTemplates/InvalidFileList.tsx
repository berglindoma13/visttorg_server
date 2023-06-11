import * as React from 'react';
import { Html } from '@react-email/html';
import { Text } from '@react-email/text'

export const InvalidFileList = (props) => {
  const { textString } = props;

  return (
    <Html lang="en">
      <Text>{textString}</Text>
    </Html>
  );
}
