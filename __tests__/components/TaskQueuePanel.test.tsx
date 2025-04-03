import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskQueuePanel from '@/components/TaskQueuePanel';
import { I18nContext } from '@/components/common/I18nContext';
import { Task, TaskStatus } from '@/lib/task-queue';

// Mock translations
const mockT = (key: string) => key;
const mockI18n = {
  language: 'en',
  t: mockT,
  locale: 'en',
};

// Mock tasks
const createMockTask = (id: string, status: TaskStatus, type: TaskType): Task => ({
  id,
  type,
  prompt: 'test prompt',
  model: 'test-model',
  options: {},
  status,
  result: null,
  error: null,
  createdAt: new Date().toISOString(),
});

const mockTasks = [
  createMockTask('1', 'pending', 'image'),
  createMockTask('2', 'in_progress', 'video'),
  createMockTask('3', 'completed', 'image'),
];

const defaultProps = {
  tasks: mockTasks,
  onTaskCancel: jest.fn(),
};

const renderWithProviders = (props = defaultProps) => {
  return render(
    <I18nContext.Provider value={mockI18n}>
      <TaskQueuePanel {...props} />
    </I18nContext.Provider>
  );
};

describe('TaskQueuePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task list correctly', () => {
    renderWithProviders();
    
    expect(screen.getByText('taskQueue.title')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(mockTasks.length);
  });

  it('displays task status correctly', () => {
    renderWithProviders();
    
    expect(screen.getByText('status.pending')).toBeTruthy();
    expect(screen.getByText('status.in_progress')).toBeTruthy();
    expect(screen.getByText('status.completed')).toBeTruthy();
  });

  it('displays task type correctly', () => {
    renderWithProviders();
    
    const imageTypes = screen.getAllByText('generationType.image');
    const videoTypes = screen.getAllByText('generationType.video');
    
    expect(imageTypes).toHaveLength(2); // 2 image tasks
    expect(videoTypes).toHaveLength(1); // 1 video task
  });

  it('handles task cancellation', () => {
    const onTaskCancel = jest.fn();
    renderWithProviders({ ...defaultProps, onTaskCancel });
    
    const cancelButtons = screen.getAllByRole('button', { name: /taskQueue.cancel/i });
    fireEvent.click(cancelButtons[0]); // Cancel first task
    
    expect(onTaskCancel).toHaveBeenCalledWith(mockTasks[0].id);
  });

  it('shows correct status indicators', () => {
    renderWithProviders();
    
    const pendingTask = screen.getByText('status.pending');
    const inProgressTask = screen.getByText('status.in_progress');
    const completedTask = screen.getByText('status.completed');
    
    expect(pendingTask.classList.contains('bg-yellow-100')).toBeTruthy();
    expect(inProgressTask.classList.contains('bg-blue-100')).toBeTruthy();
    expect(completedTask.classList.contains('bg-green-100')).toBeTruthy();
  });

  it('renders empty state when no tasks', () => {
    renderWithProviders({ ...defaultProps, tasks: [] });
    
    expect(screen.getByText('taskQueue.empty')).toBeTruthy();
  });

  it('displays task prompts', () => {
    renderWithProviders();
    
    mockTasks.forEach(task => {
      expect(screen.getByText(task.prompt)).toBeTruthy();
    });
  });
});