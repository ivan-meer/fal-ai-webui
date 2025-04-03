import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TextToImageForm from '@/components/TextToImageForm';
import { NotificationContext } from '@/components/common/NotificationContext';

// Mock translations
const mockT = (key: string) => key;
const mockI18n = {
  language: 'en',
  t: mockT,
};

// Mock notification context
const mockShowNotification = jest.fn();
const mockNotificationContext = {
  showNotification: mockShowNotification,
  notification: {
    show: false,
    message: '',
    type: 'success' as const
  },
};

// Mock task queue
const mockAddTask = jest.fn();
const mockGetPendingTasks = jest.fn().mockReturnValue([]);

const defaultProps = {
  onSubmit: jest.fn(),
  initialState: undefined,
  taskQueue: {
    addTask: mockAddTask,
    getPendingTasks: mockGetPendingTasks,
  },
};

const renderWithProviders = (props = defaultProps) => {
  return render(

      <NotificationContext.Provider value={mockNotificationContext}>
        <TextToImageForm {...props} />
      </NotificationContext.Provider>
  );
};

describe('TextToImageForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form elements correctly', () => {
    renderWithProviders();
    
    expect(screen.getByLabelText(/form.prompt/i)).toBeTruthy();
    expect(screen.getByLabelText(/form.negativePrompt/i)).toBeTruthy();
    expect(screen.getByLabelText(/form.aspectRatio/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /form.generate/i })).toBeTruthy();
  });

  it('handles prompt input correctly', () => {
    renderWithProviders();
    const promptInput = screen.getByLabelText(/form.prompt/i);
    
    fireEvent.change(promptInput, { target: { value: 'test prompt' } });
    expect((promptInput as HTMLInputElement).value).toBe('test prompt');
  });

  it('validates empty prompt', async () => {
    renderWithProviders();
    const submitButton = screen.getByRole('button', { name: /form.generate/i });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'form.errorEmptyPrompt',
        'error'
      );
    });
    expect(mockAddTask).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    renderWithProviders();
    const promptInput = screen.getByLabelText(/form.prompt/i);
    const submitButton = screen.getByRole('button', { name: /form.generate/i });
    
    fireEvent.change(promptInput, { target: { value: 'valid prompt' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledWith(
        'image',
        'valid prompt',
        expect.any(String),
        expect.objectContaining({
          negative_prompt: '',
          aspect_ratio: expect.any(String),
        })
      );
    });
  });

  it('loads initial state correctly', () => {
    const initialState = {
      prompt: 'initial prompt',
      negativePrompt: 'initial negative',
      aspectRatio: '1:1' as const,
    };
    
    renderWithProviders({
      ...defaultProps,
      initialState: initialState,
    });
    
    expect((screen.getByLabelText(/form.prompt/i) as HTMLInputElement).value).toBe('initial prompt');
    expect((screen.getByLabelText(/form.negativePrompt/i) as HTMLInputElement).value).toBe('initial negative');
    expect((screen.getByLabelText(/form.aspectRatio/i) as HTMLInputElement).value).toBe('1:1');
  });
});