import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../src/navigation/AppNavigator', () => {
  const { View, Text } = require('react-native');
  return {
    AppNavigator: () => (
      <View testID="app-navigator">
        <Text>InStock Navigator</Text>
      </View>
    ),
  };
});

test('renders InStock App and Providers correctly', async () => {
  let tree: any;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  expect(tree.toJSON()).toBeTruthy();
});
