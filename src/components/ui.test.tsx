import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { Button } from './ui';

describe('Button', () => {
  it('exposes an accessible button and handles a press', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<Button title="Continue" onPress={onPress} />);
    fireEvent.press(getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes disabled state and ignores presses while disabled', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<Button title="Continue" onPress={onPress} disabled />);
    const button = getByRole('button', { name: 'Continue' });

    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false, selected: false });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes selected state for choice buttons', async () => {
    const { getByRole } = await render(<Button title="Ajman" onPress={() => undefined} selected />);

    expect(getByRole('button', { name: 'Ajman' }).props.accessibilityState).toEqual({
      disabled: false,
      busy: false,
      selected: true,
    });
  });

  it('marks loading buttons busy and prevents duplicate presses', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<Button title="Saving" onPress={onPress} loading />);
    const button = getByRole('button', { name: 'Saving' });

    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true, selected: false });
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
