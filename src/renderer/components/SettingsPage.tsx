import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2, Edit2 } from 'lucide-react';

interface BlogTarget {
  id: string;
  name: string;
  github: {
    repo: string;
    branch: string;
    token: string;
  };
  cloudflare?: {
    accountId: string;
    projectName: string;
    token: string;
  };
  content: {
    path: string;
    format: 'single-file' | 'multi-file';
    filename?: string;
  };
}

interface SettingsPageProps {
  vaultPath?: string | null;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ vaultPath }) => {
  const [blogs, setBlogs] = useState<BlogTarget[]>([]);
  const [editingBlog, setEditingBlog] = useState<BlogTarget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.publish.getBlogs();
      if (result.success) {
        setBlogs(result.blogs || []);
      }
    } catch (error) {
      console.error('Failed to load blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlog = () => {
    setEditingBlog({
      id: crypto.randomUUID(),
      name: '',
      github: {
        repo: '',
        branch: 'main',
        token: ''
      },
      cloudflare: {
        accountId: '',
        projectName: '',
        token: ''
      },
      content: {
        path: 'src/content/posts/',
        format: 'single-file',
        filename: '{tag}.md'
      }
    });
  };

  const handleEditBlog = (blog: BlogTarget) => {
    setEditingBlog({ ...blog });
  };

  const handleSaveBlog = async () => {
    if (!editingBlog) return;

    // Validate required fields
    const errors: string[] = [];

    if (!editingBlog.name.trim()) {
      errors.push('Blog name is required');
    }
    if (!editingBlog.github.repo.trim()) {
      errors.push('GitHub repository is required');
    }
    if (!editingBlog.github.branch.trim()) {
      errors.push('GitHub branch is required');
    }
    if (!editingBlog.github.token.trim()) {
      errors.push('GitHub token is required');
    }
    if (!editingBlog.content.path.trim()) {
      errors.push('Content path is required');
    }
    if (!editingBlog.content.filename?.trim()) {
      errors.push('Filename template is required');
    }

    // Cloudflare fields are optional, but if any are filled, all must be filled
    const cf = editingBlog.cloudflare;
    if (cf && (cf.accountId || cf.projectName || cf.token)) {
      if (!cf.accountId.trim()) {
        errors.push('Cloudflare account ID is required when using Cloudflare');
      }
      if (!cf.projectName.trim()) {
        errors.push('Cloudflare project name is required when using Cloudflare');
      }
      if (!cf.token.trim()) {
        errors.push('Cloudflare API token is required when using Cloudflare');
      }
    }

    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n' + errors.join('\n'));
      return;
    }

    try {
      const result = await window.electronAPI.publish.saveBlog(editingBlog);
      if (result.success) {
        await loadBlogs();
        setEditingBlog(null);
      }
    } catch (error) {
      console.error('Failed to save blog:', error);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog configuration?')) {
      return;
    }

    try {
      const result = await window.electronAPI.publish.deleteBlog(id);
      if (result.success) {
        await loadBlogs();
      }
    } catch (error) {
      console.error('Failed to delete blog:', error);
    }
  };

  const handleCancel = () => {
    setEditingBlog(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <p style={{ color: '#5c5c5c' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Blog edit form
  if (editingBlog) {
    return (
      <div className="flex-1 overflow-y-auto" style={{ padding: '40px 48px' }}>
        <div className="max-w-2xl">
          {/* Back button */}
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 mb-6 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            style={{ color: '#5c5c5c' }}
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
            <span style={{ fontSize: '14px' }}>Back to Settings</span>
          </button>

          <h2 className="font-semibold mb-6" style={{ fontSize: '20px', color: '#1a1a1a' }}>
            {blogs.find(b => b.id === editingBlog.id) ? 'Edit Blog' : 'Add Blog'}
          </h2>

          <div className="space-y-6">
            {/* Blog Name */}
            <div>
              <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>
                Blog Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={editingBlog.name}
                onChange={e => setEditingBlog({ ...editingBlog, name: e.target.value })}
                className="w-full px-3 py-2 rounded"
                style={{ fontSize: '14px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', color: '#1a1a1a' }}
                placeholder="My Blog"
              />
            </div>

            {/* GitHub Section */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
              <h3 className="uppercase tracking-wider mb-4" style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>GitHub</h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>
                    Repository (username/repo) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingBlog.github.repo}
                    onChange={e => setEditingBlog({
                      ...editingBlog,
                      github: { ...editingBlog.github, repo: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded"
                    style={{ fontSize: '14px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', color: '#1a1a1a' }}
                    placeholder="username/blog-repo"
                  />
                </div>

                <div>
                  <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>
                    Branch <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingBlog.github.branch}
                    onChange={e => setEditingBlog({
                      ...editingBlog,
                      github: { ...editingBlog.github, branch: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded"
                    style={{ fontSize: '14px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', color: '#1a1a1a' }}
                    placeholder="main"
                  />
                </div>

                <div>
                  <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>
                    Personal Access Token <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    value={editingBlog.github.token}
                    onChange={e => setEditingBlog({
                      ...editingBlog,
                      github: { ...editingBlog.github, token: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded"
                    style={{ fontSize: '14px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', color: '#1a1a1a' }}
                    placeholder="ghp_..."
                  />
                </div>
              </div>
            </div>

            {/* Cloudflare Section */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
              <h3 className="uppercase tracking-wider mb-1" style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>Cloudflare Pages</h3>
              <p className="mb-4" style={{ fontSize: '12px', color: '#999999' }}>
                Optional: Add these to track deployment status
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>
                    Account ID
                  </label>
                  <input
                    type="text"
                    value={editingBlog.cloudflare?.accountId || ''}
                    onChange={e => setEditingBlog({
                      ...editingBlog,
                      cloudflare: {
                        accountId: e.target.value,
                        projectName: editingBlog.cloudflare?.projectName || '',
                        token: editingBlog.cloudflare?.token || ''
                      }
                    })}
                    className="w-full px-3 py-2 rounded"
                    style={{ fontSize: '14px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', color: '#1a1a1a' }}
                    placeholder="Your Cloudflare account ID"
                  />
                  <p className="mt-1" style={{ fontSize: '11px', color: '#999999' }}>
                    Found in Cloudflare dashboard URL or Workers & Pages → Overview
                  </p>
                </div>

                <div>
                  <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={editingBlog.cloudflare?.projectName || ''}
                    onChange={e => setEditingBlog({
                      ...editingBlog,
                      cloudflare: {
                        accountId: editingBlog.cloudflare?.accountId || '',
                        projectName: e.target.value,
                        token: editingBlog.cloudflare?.token || ''
                      }
                    })}
                    className="w-full px-3 py-2 rounded"
                    style={{ fontSize: '14px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', color: '#1a1a1a' }}
                    placeholder="my-blog"
                  />
                  <p className="mt-1" style={{ fontSize: '11px', color: '#999999' }}>
                    The name of your Pages project (not the domain)
                  </p>
                </div>

                <div>
                  <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>
                    API Token
                  </label>
                  <input
                    type="password"
                    value={editingBlog.cloudflare?.token || ''}
                    onChange={e => setEditingBlog({
                      ...editingBlog,
                      cloudflare: {
                        accountId: editingBlog.cloudflare?.accountId || '',
                        projectName: editingBlog.cloudflare?.projectName || '',
                        token: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 rounded"
                    style={{ fontSize: '14px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', color: '#1a1a1a' }}
                    placeholder="Your Cloudflare API token"
                  />
                  <p className="mt-1" style={{ fontSize: '11px', color: '#999999' }}>
                    Create at: dash.cloudflare.com → My Profile → API Tokens
                  </p>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
              <h3 className="uppercase tracking-wider mb-4" style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>Content</h3>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>
                    Content Path <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingBlog.content.path}
                    onChange={e => setEditingBlog({
                      ...editingBlog,
                      content: { ...editingBlog.content, path: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded"
                    style={{ fontSize: '14px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', color: '#1a1a1a' }}
                    placeholder="src/content/posts/"
                  />
                </div>

                <div>
                  <label className="block mb-1.5" style={{ fontSize: '13px', fontWeight: 500, color: '#5c5c5c' }}>
                    Filename Template <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editingBlog.content.filename || ''}
                    onChange={e => setEditingBlog({
                      ...editingBlog,
                      content: { ...editingBlog.content, filename: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded"
                    style={{ fontSize: '14px', border: '1px solid #e0e0e0', backgroundColor: '#fafafa', color: '#1a1a1a' }}
                    placeholder="{tag}.md"
                  />
                  <p className="mt-1" style={{ fontSize: '11px', color: '#999999' }}>
                    Use {'{tag}'} as a placeholder for the tag name
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded transition-colors hover:bg-gray-100"
                style={{ fontSize: '14px', color: '#5c5c5c', border: '1px solid #e0e0e0' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBlog}
                className="px-4 py-2 rounded transition-colors hover:opacity-90"
                style={{ fontSize: '14px', color: '#ffffff', backgroundColor: '#737373' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main settings view
  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '40px 48px' }}>
      <div className="max-w-2xl">
        <h1 className="font-semibold mb-2" style={{ fontSize: '24px', color: '#1a1a1a' }}>Settings</h1>
        {vaultPath && (
          <p className="mb-8" style={{ fontSize: '13px', color: '#999999' }}>
            Vault: {vaultPath}
          </p>
        )}

        {/* Blog Configurations Section */}
        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <h2 className="font-semibold" style={{ fontSize: '16px', color: '#1a1a1a' }}>Blog Configurations</h2>
            <button
              onClick={handleAddBlog}
              className="flex items-center transition-colors duration-150"
              style={{
                padding: '11px 20px 11px 14px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#52525b',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.06)',
                border: '1px solid #e4e4e7',
                borderRadius: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <Plus size={16} strokeWidth={3} style={{ marginRight: '8px' }} />
              Add Blog
            </button>
          </div>

          {blogs.length === 0 ? (
            <div className="py-12 text-center rounded-lg" style={{ border: '1px dashed #e0e0e0' }}>
              <p style={{ fontSize: '14px', color: '#999999' }}>
                No blog configurations yet. Add one to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blogs.map(blog => (
                <div
                  key={blog.id}
                  className="flex items-center justify-between transition-shadow hover:shadow-md"
                  style={{ padding: '12px 20px 16px 20px', border: '1px solid #e4e4e7', backgroundColor: '#ffffff', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.06)', borderRadius: '8px' }}
                >
                  <div>
                    <h3 className="font-medium" style={{ fontSize: '14px', color: '#1a1a1a' }}>{blog.name}</h3>
                    <p style={{ fontSize: '13px', color: '#999999' }}>
                      {blog.github.repo}{blog.cloudflare?.projectName ? ` → ${blog.cloudflare.projectName}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditBlog(blog)}
                      className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                      style={{ color: '#737373', backgroundColor: 'transparent' }}
                      title="Edit"
                    >
                      <Edit2 size={16} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="p-2 rounded-lg transition-colors hover:bg-red-50"
                      style={{ color: '#ef4444', backgroundColor: 'transparent' }}
                      title="Delete"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
