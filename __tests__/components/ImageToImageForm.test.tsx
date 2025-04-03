import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageToImageForm from '@/components/ImageToImageForm';
import { NotificationContext } from '@/components/common/NotificationContext';
import { I18nContext } from '@/components/common/I18nContext';

// Mock translations
const mockT = (key: string) => key;
const mockI18n = {
  language: 'en',
  t: mockT,
  locale: 'en',
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

// Mock file data
const createMockFile = () => {
  const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
  return mockFile;
};

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
    <I18nContext.Provider value={mockI18n}>
      <NotificationContext.Provider value={mockNotificationContext}>
        <ImageToImageForm {...props} />
      </NotificationContext.Provider>
    </I18nContext.Provider>
  );
};

describe('ImageToImageForm', () => {
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

  it('handles image upload correctly', async () => {
    renderWithProviders();
    const file = createMockFile();
    const fileInput = screen.getByLabelText(/form.uploadImage/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByRole('img')).toBeTruthy();
    });
  });

  it('validates file type', async () => {
    renderWithProviders();
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/form.uploadImage/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'form.errorInvalidImageType',
        'error'
      );
    });
  });

  it('submits form with valid data', async () => {
    renderWithProviders();
    const promptInput = screen.getByLabelText(/form.prompt/i);
    const file = createMockFile();
    const fileInput = screen.getByLabelText(/form.uploadImage/i);
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    
    fireEvent.change(fileInput);
    fireEvent.change(promptInput, { target: { value: 'valid prompt' } });
    
    const submitButton = screen.getByRole('button', { name: /form.generate/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledWith(
        'image2image',
        'valid prompt',
        expect.any(String),
        expect.objectContaining({
          negative_prompt: '',
          aspect_ratio: expect.any(String),
          image: expect.any(File),
        })
      );
    });
  });

  it('loads initial state correctly', () => {
    const initialState = {
      prompt: 'initial prompt',
      negativePrompt: 'initial negative',
      aspectRatio: '1:1' as const,
      selectedModel: '',
      numImages: 1,
      strength: 0.5,
      outputFormat: 'png',
      enableSafetyChecker: true,
      safetyTolerance: 'low',
      seed: undefined,
    };
    
    renderWithProviders({
      ...defaultProps,
      initialState,
    });
    
    expect((screen.getByLabelText(/form.prompt/i) as HTMLInputElement).value).toBe('initial prompt');
    expect((screen.getByLabelText(/form.negativePrompt/i) as HTMLInputElement).value).toBe('initial negative');
    expect((screen.getByLabelText(/form.aspectRatio/i) as HTMLInputElement).value).toBe('1:1');
  });
});