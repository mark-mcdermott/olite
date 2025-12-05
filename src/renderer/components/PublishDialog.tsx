import React, { useState, useEffect } from 'react';

interface PublishDialogProps {
  tag: string;
  onClose: () => void;
}

interface BlogTarget {
  id: string;
  name: string;
}

interface PublishStep {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  message?: string;
}

type PublishStatus = 'pending' | 'preparing' | 'pushing' | 'building' | 'deploying' | 'completed' | 'failed';

export const PublishDialog: React.FC<PublishDialogProps> = ({ tag, onClose }) => {
  const [blogs, setBlogs] = useState<BlogTarget[]>([]);
  const [selectedBlogId, setSelectedBlogId] = useState<string>('');
  const [publishing, setPublishing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<PublishStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<PublishStep[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  useEffect(() => {
    if (jobId) {
      subscribeToProgress();
      return () => {
        window.electronAPI.publish.unsubscribe(jobId);
      };
    }
  }, [jobId]);

  const loadBlogs = async () => {
    try {
      const result = await window.electronAPI.publish.getBlogs();
      console.log('PublishDialog: getBlogs result:', result);
      if (result.success && result.blogs) {
        console.log('PublishDialog: Blogs loaded:', result.blogs);
        setBlogs(result.blogs);
        if (result.blogs.length > 0) {
          setSelectedBlogId(result.blogs[0].id);
        }
      } else {
        console.error('PublishDialog: Failed to load blogs:', result.error);
      }
    } catch (error) {
      console.error('Failed to load blogs:', error);
    }
  };

  const subscribeToProgress = async () => {
    if (!jobId) return;

    await window.electronAPI.publish.subscribe(jobId, (data: any) => {
      setStatus(data.status);
      setProgress(data.progress);
      setSteps(data.steps || []);
      if (data.error) {
        setError(data.error);
      }
    });
  };

  const handlePublish = async () => {
    if (!selectedBlogId) return;

    try {
      setPublishing(true);
      setError(null);

      const result = await window.electronAPI.publish.toBlog(selectedBlogId, tag);

      if (result.success && result.jobId) {
        setJobId(result.jobId);
      } else {
        setError(result.error || 'Failed to start publish job');
        setPublishing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish');
      setPublishing(false);
    }
  };

  const handleClose = () => {
    if (jobId) {
      window.electronAPI.publish.unsubscribe(jobId);
    }
    onClose();
  };

  const getStatusColor = (status: PublishStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'preparing':
      case 'pushing':
      case 'building':
      case 'deploying':
        return 'text-accent';
      default:
        return 'text-obsidian-text-secondary';
    }
  };

  const getStepIcon = (stepStatus: PublishStep['status']) => {
    switch (stepStatus) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '⋯';
      case 'failed':
        return '✗';
      default:
        return '○';
    }
  };

  if (blogs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-obsidian-bg-secondary shadow-xl rounded-xl p-6 max-w-md w-full m-4 border border-obsidian-border">
          <h2 className="text-lg font-semibold mb-4 text-obsidian-text">
            No Blogs Configured
          </h2>
          <p className="text-obsidian-text-secondary mb-4">
            You need to configure at least one blog before publishing. Open Settings to add one.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-obsidian-text-secondary hover:bg-obsidian-hover rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-obsidian-bg-secondary shadow-xl rounded-xl p-6 max-w-md w-full m-4 border border-obsidian-border">
        <h2 className="text-lg font-semibold mb-4 text-obsidian-text flex items-center gap-2">
          Publish <span className="text-accent">#{tag}</span>
        </h2>

        {!publishing ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-obsidian-text-secondary mb-2">
                Select Blog
              </label>
              <select
                value={selectedBlogId}
                onChange={e => setSelectedBlogId(e.target.value)}
                className="w-full px-3 py-2 border border-obsidian-border rounded-lg bg-obsidian-surface text-obsidian-text focus:border-accent focus:ring-1 focus:ring-accent outline-none"
              >
                {blogs.map(blog => (
                  <option key={blog.id} value={blog.id}>
                    {blog.name || 'Unnamed Blog'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-obsidian-text-secondary hover:bg-obsidian-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
              >
                Publish
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <span className="text-sm text-obsidian-text-secondary">
                  {progress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-obsidian-surface rounded-full h-1.5 mb-4">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    status === 'failed' ? 'bg-red-500' :
                    status === 'completed' ? 'bg-green-500' :
                    'bg-accent'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className={`text-sm ${
                      step.status === 'completed' ? 'text-green-500' :
                      step.status === 'failed' ? 'text-red-500' :
                      step.status === 'in_progress' ? 'text-accent' :
                      'text-obsidian-text-muted'
                    }`}>
                      {getStepIcon(step.status)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-obsidian-text">{step.name}</p>
                      {step.message && (
                        <p className="text-xs text-obsidian-text-muted">{step.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              {(status === 'completed' || status === 'failed') && (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-obsidian-surface text-obsidian-text rounded-lg hover:bg-obsidian-hover transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
