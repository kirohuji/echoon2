import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Folder, File, FileVideo, FileAudio, FileImage, FileText, FileArchive,
  Plus, Trash2, Edit3, Save, ChevronRight, ChevronDown, ArrowLeft,
  ShieldAlert, Loader2, ExternalLink, Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectItem,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/cn';
import {
  getResourceTree, getResourceRegions,
  createResourceNode, updateResourceNode, deleteResourceNode,
  type ResourceTreeNode, type CreateResourceNodePayload,
} from '@/features/admin/api-resources';
import { useAuth } from '@/providers/auth-provider';

const typeLabels: Record<string, string> = {
  folder: '文件夹',
  video_url: '视频地址',
  video: '视频文件',
  audio: '音频文件',
  pdf: 'PDF文档',
  image: '图片',
  document: '文档',
  other: '其他',
};

const typeIcons: Record<string, React.ElementType> = {
  folder: Folder,
  video_url: FileVideo,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  image: FileImage,
  document: FileText,
  other: FileArchive,
};

const typeOptions = Object.entries(typeLabels)
  .filter(([k]) => k !== 'folder')
  .map(([value, label]) => ({ value, label }));

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminResourcesPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [tree, setTree] = useState<ResourceTreeNode[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<ResourceTreeNode | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [regionFilter, setRegionFilter] = useState('');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [createMode, setCreateMode] = useState<'folder' | 'resource' | null>(null);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState('pdf');
  const [createRegion, setCreateRegion] = useState('');
  const [createUrl, setCreateUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [treeData, regionsData] = await Promise.all([
        getResourceTree(regionFilter || undefined),
        getResourceRegions(),
      ]);
      setTree(treeData);
      setRegions(regionsData);
    } catch {
      setTree([]);
    } finally {
      setIsLoading(false);
    }
  }, [regionFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectNode = async (node: ResourceTreeNode) => {
    setSelectedNode(node);
    setIsCreating(false);
    setIsEditing(false);
    setEditName(node.name);
    setEditType(node.type);
    setEditRegion(node.region ?? '');
    setEditUrl(node.url ?? '');
    setEditDescription(node.description ?? '');
  };

  const handleSave = async () => {
    if (!selectedNode) return;
    setSaving(true);
    try {
      await updateResourceNode(selectedNode.id, {
        name: editName,
        region: editRegion || null,
        url: editUrl || null,
        description: editDescription || null,
      });
      await fetchData();
      setSelectedNode((prev) =>
        prev ? { ...prev, name: editName, region: editRegion || null, url: editUrl || null, description: editDescription || null } : null
      );
      setIsEditing(false);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNode) return;
    if (!confirm(`确定要删除「${selectedNode.name}」${selectedNode.children?.length ? '及其所有子节点' : ''}吗？`)) return;
    setDeleting(true);
    try {
      await deleteResourceNode(selectedNode.id);
      setSelectedNode(null);
      setIsEditing(false);
      await fetchData();
    } catch {
      // handle error
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setSaving(true);
    try {
      const payload: CreateResourceNodePayload = {
        parentId: createParentId ?? undefined,
        name: createName.trim(),
        type: createMode === 'folder' ? 'folder' : createType,
      };
      if (createRegion) payload.region = createRegion;
      if (createMode === 'resource' && createType === 'video_url' && createUrl) {
        payload.url = createUrl;
      }
      await createResourceNode(payload);
      setIsCreating(false);
      setCreateName('');
      setCreateUrl('');
      // Expand parent
      if (createParentId) {
        setExpandedIds((prev) => new Set(prev).add(createParentId));
      }
      await fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  };

  if (session && session.user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ShieldAlert className="h-16 w-16 text-muted-foreground/30" />
        <p className="mt-4 text-lg font-semibold text-muted-foreground">需要管理员权限</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">资料库管理</h1>
          <p className="text-sm text-muted-foreground">管理各地区的学习资料，支持视频、音频、PDF 等多种格式</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCreateMode('folder');
              setCreateParentId(null);
              setCreateName('');
              setCreateRegion('');
              setIsCreating(true);
              setSelectedNode(null);
              setIsEditing(false);
            }}
          >
            <FolderOpen className="mr-1.5 h-4 w-4" />
            新建根文件夹
          </Button>
        </div>
      </div>

      {/* Region Filter */}
      {regions.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setRegionFilter('')}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                !regionFilter ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              全部地区
            </button>
            {regions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRegionFilter(r)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-all',
                  regionFilter === r ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-4">
        {/* Left: Tree Panel */}
        <Card className="w-72 flex-shrink-0 shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              目录结构
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 max-h-[calc(100vh-260px)] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : tree.length === 0 ? (
              <div className="py-8 text-center">
                <Folder className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="mt-2 text-xs text-muted-foreground">暂无资料</p>
              </div>
            ) : (
              tree.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  expandedIds={expandedIds}
                  selectedId={selectedNode?.id ?? null}
                  onToggle={toggleExpand}
                  onSelect={selectNode}
                  onAddFolder={(parentId) => {
                    setCreateMode('folder');
                    setCreateParentId(parentId);
                    setCreateName('');
                    setCreateRegion('');
                    setIsCreating(true);
                    setSelectedNode(null);
                    setIsEditing(false);
                  }}
                  onAddResource={(parentId) => {
                    setCreateMode('resource');
                    setCreateParentId(parentId);
                    setCreateName('');
                    setCreateType('pdf');
                    setCreateRegion('');
                    setCreateUrl('');
                    setIsCreating(true);
                    setSelectedNode(null);
                    setIsEditing(false);
                  }}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* Right: Detail / Create Panel */}
        <Card className="flex-1 shadow-none">
          <CardContent className="p-4">
            {isCreating ? (
              // ─── Create Form ───
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {createMode === 'folder' ? (
                    <FolderOpen className="h-5 w-5 text-amber-500" />
                  ) : (
                    <File className="h-5 w-5 text-blue-500" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {createMode === 'folder' ? '新建文件夹' : '新建资料'}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>名称</Label>
                    <Input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder={createMode === 'folder' ? '文件夹名称' : '资料名称'}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                  </div>

                  <div>
                    <Label>地区</Label>
                    <Input
                      value={createRegion}
                      onChange={(e) => setCreateRegion(e.target.value)}
                      placeholder="留空表示通用资料"
                    />
                    <p className="text-xs text-muted-foreground mt-1">留空则表示该资料适用于所有地区</p>
                  </div>

                  {createMode === 'resource' && (
                    <>
                      <div>
                        <Label>类型</Label>
                        <Select value={createType} onChange={(e) => setCreateType(e.target.value)}>
                          {typeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>

                      {createType === 'video_url' && (
                        <div>
                          <Label>视频地址</Label>
                          <Input
                            value={createUrl}
                            onChange={(e) => setCreateUrl(e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={handleCreate} disabled={saving || !createName.trim()} size="sm">
                    {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                    创建
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                    取消
                  </Button>
                </div>
              </div>
            ) : !selectedNode ? (
              // ─── Empty State ───
              <div className="flex flex-col items-center py-16 text-center">
                <FolderOpen className="h-16 w-16 text-muted-foreground/20" />
                <p className="mt-4 text-sm font-medium text-muted-foreground">选择一个节点查看详情</p>
                <p className="mt-1 text-xs text-muted-foreground/60">从左侧目录树中选择文件夹或资料</p>
              </div>
            ) : isEditing ? (
              // ─── Edit Form ───
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">编辑：{selectedNode.name}</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>名称</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>

                  <div>
                    <Label>地区</Label>
                    <Input
                      value={editRegion}
                      onChange={(e) => setEditRegion(e.target.value)}
                      placeholder="留空表示通用资料"
                    />
                  </div>

                  {selectedNode.type === 'video_url' && (
                    <div>
                      <Label>视频地址</Label>
                      <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
                    </div>
                  )}

                  <div>
                    <Label>描述</Label>
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={handleSave} disabled={saving || !editName.trim()} size="sm">
                    {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                    <Save className="mr-1.5 h-4 w-4" />
                    保存
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setIsEditing(false);
                    setEditName(selectedNode.name);
                    setEditRegion(selectedNode.region ?? '');
                    setEditUrl(selectedNode.url ?? '');
                    setEditDescription(selectedNode.description ?? '');
                  }}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              // ─── Detail View ───
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(typeIcons[selectedNode.type] || File, {
                      className: cn(
                        'h-10 w-10',
                        selectedNode.type === 'folder' ? 'text-amber-500' :
                        selectedNode.type.includes('video') ? 'text-blue-500' :
                        selectedNode.type === 'audio' ? 'text-emerald-500' :
                        selectedNode.type === 'pdf' ? 'text-red-500' :
                        selectedNode.type === 'image' ? 'text-purple-500' :
                        'text-muted-foreground',
                      ),
                    })}
                    <div>
                      <h3 className="text-lg font-semibold">{selectedNode.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {typeLabels[selectedNode.type] || selectedNode.type}
                        </Badge>
                        {selectedNode.region && (
                          <Badge variant="outline" className="text-xs">
                            {selectedNode.region}
                          </Badge>
                        )}
                        {!selectedNode.region && (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                            通用资料
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {selectedNode.type === 'folder' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCreateMode('folder');
                            setCreateParentId(selectedNode.id);
                            setCreateName('');
                            setCreateRegion('');
                            setIsCreating(true);
                          }}
                        >
                          <FolderOpen className="mr-1 h-3.5 w-3.5" />
                          子文件夹
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCreateMode('resource');
                            setCreateParentId(selectedNode.id);
                            setCreateName('');
                            setCreateType('pdf');
                            setCreateRegion('');
                            setCreateUrl('');
                            setIsCreating(true);
                          }}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          添加资料
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit3 className="mr-1 h-3.5 w-3.5" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-destructive hover:text-destructive"
                    >
                      {deleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* File Preview */}
                {selectedNode.asset && (
                  <div className="rounded-lg border border-border p-4 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground mb-2">文件预览</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background border">
                        {React.createElement(typeIcons[selectedNode.type] || File, {
                          className: 'h-6 w-6 text-muted-foreground',
                        })}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{selectedNode.asset.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedNode.asset.mimeType} · {formatSize(selectedNode.asset.size)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto flex-shrink-0"
                        onClick={() => window.open(selectedNode.asset!.url, '_blank')}
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        打开
                      </Button>
                    </div>
                  </div>
                )}

                {/* URL Preview */}
                {selectedNode.type === 'video_url' && selectedNode.url && (
                  <div className="rounded-lg border border-border p-4 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground mb-2">视频地址</p>
                    <div className="flex items-center gap-2">
                      <FileVideo className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <a
                        href={selectedNode.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {selectedNode.url}
                      </a>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedNode.description && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">描述</p>
                    <p className="text-sm text-foreground/80">{selectedNode.description}</p>
                  </div>
                )}

                {/* Meta Info */}
                <div className="border-t border-border pt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">创建时间：</span>
                      {new Date(selectedNode.createdAt).toLocaleString('zh-CN')}
                    </div>
                    <div>
                      <span className="font-medium">更新时间：</span>
                      {new Date(selectedNode.updatedAt).toLocaleString('zh-CN')}
                    </div>
                    {selectedNode.fileSize && (
                      <div>
                        <span className="font-medium">文件大小：</span>
                        {formatSize(selectedNode.fileSize)}
                      </div>
                    )}
                    {selectedNode.mimeType && (
                      <div>
                        <span className="font-medium">MIME：</span>
                        {selectedNode.mimeType}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tree Node Component ───

interface TreeNodeItemProps {
  node: ResourceTreeNode;
  depth: number;
  expandedIds: Set<string>;
  selectedId: string | null;
  onToggle: (id: string) => void;
  onSelect: (node: ResourceTreeNode) => void;
  onAddFolder: (parentId: string) => void;
  onAddResource: (parentId: string) => void;
}

function TreeNodeItem({
  node, depth, expandedIds, selectedId,
  onToggle, onSelect, onAddFolder, onAddResource,
}: TreeNodeItemProps) {
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isFolder = node.type === 'folder';
  const IconComponent = isExpanded && isFolder ? FolderOpen : (typeIcons[node.type] || File);

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md px-1 py-1 cursor-pointer transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-muted text-foreground/80',
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => {
          onSelect(node);
          if (isFolder && hasChildren) {
            onToggle(node.id);
          }
        }}
      >
        {/* Expand/Collapse toggle */}
        <button
          type="button"
          className={cn(
            'flex-shrink-0 p-0.5 rounded hover:bg-muted-foreground/10 transition-colors',
            !hasChildren && 'invisible',
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        <IconComponent
          className={cn(
            'flex-shrink-0 h-4 w-4',
            isFolder ? 'text-amber-500' :
            node.type.includes('video') ? 'text-blue-500' :
            node.type === 'audio' ? 'text-emerald-500' :
            node.type === 'pdf' ? 'text-red-500' :
            node.type === 'image' ? 'text-purple-500' :
            'text-muted-foreground',
          )}
        />

        <span className="text-sm truncate flex-1 min-w-0">{node.name}</span>

        {!node.region && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 flex-shrink-0 opacity-50">
            通用
          </Badge>
        )}

        {/* Quick add buttons on hover for folders */}
        {isFolder && (
          <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              className="p-0.5 rounded hover:bg-muted-foreground/15"
              title="添加子文件夹"
              onClick={(e) => {
                e.stopPropagation();
                onAddFolder(node.id);
              }}
            >
              <FolderOpen className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="p-0.5 rounded hover:bg-muted-foreground/15"
              title="添加资料"
              onClick={(e) => {
                e.stopPropagation();
                onAddResource(node.id);
              }}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && node.children.map((child) => (
        <TreeNodeItem
          key={child.id}
          node={child}
          depth={depth + 1}
          expandedIds={expandedIds}
          selectedId={selectedId}
          onToggle={onToggle}
          onSelect={onSelect}
          onAddFolder={onAddFolder}
          onAddResource={onAddResource}
        />
      ))}
    </div>
  );
}
