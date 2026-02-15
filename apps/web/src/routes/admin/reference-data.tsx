import { useState } from 'react';
import { Position } from '@vcm/shared';
import type {
  SkillGroup,
  SkillDefinition,
  PlayerRoleDefinition,
  PlayStyleDefinition,
} from '@vcm/shared';
import {
  useSkillGroups,
  useCreateSkillGroup,
  useUpdateSkillGroup,
  useDeleteSkillGroup,
  useCreateSkillDefinition,
  useUpdateSkillDefinition,
  useDeleteSkillDefinition,
  usePlayerRoleDefinitions,
  useCreatePlayerRoleDefinition,
  useUpdatePlayerRoleDefinition,
  useDeletePlayerRoleDefinition,
  usePlayStyleDefinitions,
  useCreatePlayStyleDefinition,
  useUpdatePlayStyleDefinition,
  useDeletePlayStyleDefinition,
} from '../../hooks/useReferenceData';

const POSITIONS = Object.values(Position);
type Tab = 'skills' | 'roles' | 'playStyles';

export function ReferenceDataPage() {
  const [activeTab, setActiveTab] = useState<Tab>('skills');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'skills', label: 'Skills' },
    { key: 'roles', label: 'Player Roles' },
    { key: 'playStyles', label: 'Play Styles' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reference Data</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'skills' && <SkillsTab />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'playStyles' && <PlayStylesTab />}
    </div>
  );
}

// ─── Skills Tab ─────────────────────────────────────────
function SkillsTab() {
  const { data: groups, isLoading } = useSkillGroups();
  const createGroup = useCreateSkillGroup();
  const updateGroup = useUpdateSkillGroup();
  const deleteGroup = useDeleteSkillGroup();
  const createSkill = useCreateSkillDefinition();
  const updateSkill = useUpdateSkillDefinition();
  const deleteSkill = useDeleteSkillDefinition();

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroup, setEditingGroup] = useState<SkillGroup | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupSort, setEditGroupSort] = useState('');
  const [addingSkillToGroup, setAddingSkillToGroup] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDefault, setNewSkillDefault] = useState('50');
  const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null);
  const [editSkillName, setEditSkillName] = useState('');
  const [editSkillDefault, setEditSkillDefault] = useState('');
  const [editSkillSort, setEditSkillSort] = useState('');

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    createGroup.mutate({ name: newGroupName.trim() }, { onSuccess: () => setNewGroupName('') });
  };

  const handleEditGroup = (group: SkillGroup) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
    setEditGroupSort(String(group.sortOrder));
  };

  const handleSaveGroup = () => {
    if (!editingGroup) return;
    updateGroup.mutate(
      { id: editingGroup.id, name: editGroupName, sortOrder: parseInt(editGroupSort, 10) },
      { onSuccess: () => setEditingGroup(null) },
    );
  };

  const handleAddSkill = (groupId: string) => {
    if (!newSkillName.trim()) return;
    createSkill.mutate(
      {
        name: newSkillName.trim(),
        skillGroupId: groupId,
        defaultValue: parseInt(newSkillDefault, 10),
      },
      {
        onSuccess: () => {
          setNewSkillName('');
          setNewSkillDefault('50');
          setAddingSkillToGroup(null);
        },
      },
    );
  };

  const handleEditSkill = (skill: SkillDefinition) => {
    setEditingSkill(skill);
    setEditSkillName(skill.name);
    setEditSkillDefault(String(skill.defaultValue));
    setEditSkillSort(String(skill.sortOrder));
  };

  const handleSaveSkill = () => {
    if (!editingSkill) return;
    updateSkill.mutate(
      {
        id: editingSkill.id,
        name: editSkillName,
        defaultValue: parseInt(editSkillDefault, 10),
        sortOrder: parseInt(editSkillSort, 10),
      },
      { onSuccess: () => setEditingSkill(null) },
    );
  };

  return (
    <div className="space-y-4">
      {/* Add Group */}
      <form onSubmit={handleAddGroup} className="flex gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="New skill group name"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={createGroup.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Add Group
        </button>
      </form>

      {/* Groups */}
      {groups?.map((group) => (
        <div key={group.id} className="bg-white rounded-lg shadow">
          <div
            className="flex items-center justify-between p-4 cursor-pointer"
            onClick={() =>
              setExpandedGroup(expandedGroup === group.id ? null : group.id)
            }
          >
            {editingGroup?.id === group.id ? (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  value={editGroupSort}
                  onChange={(e) => setEditGroupSort(e.target.value)}
                  placeholder="Sort"
                  className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <button
                  onClick={handleSaveGroup}
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingGroup(null)}
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">{group.name}</span>
                <span className="text-xs text-gray-400">
                  {group.skills?.length ?? 0} skills
                </span>
              </div>
            )}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleEditGroup(group)}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete group "${group.name}" and all its skills?`))
                    deleteGroup.mutate(group.id);
                }}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>

          {expandedGroup === group.id && (
            <div className="border-t border-gray-100 p-4 space-y-2">
              {group.skills?.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                >
                  {editingSkill?.id === skill.id ? (
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={editSkillName}
                        onChange={(e) => setEditSkillName(e.target.value)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm flex-1"
                      />
                      <input
                        type="number"
                        value={editSkillDefault}
                        onChange={(e) => setEditSkillDefault(e.target.value)}
                        min={0}
                        max={99}
                        placeholder="Default"
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <input
                        type="number"
                        value={editSkillSort}
                        onChange={(e) => setEditSkillSort(e.target.value)}
                        placeholder="Sort"
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={handleSaveSkill}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingSkill(null)}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-sm text-gray-900">{skill.name}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          (default: {skill.defaultValue})
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSkill(skill)}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete skill "${skill.name}"?`))
                              deleteSkill.mutate(skill.id);
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {/* Add Skill */}
              {addingSkillToGroup === group.id ? (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="Skill name"
                    className="rounded border border-gray-300 px-2 py-1 text-sm flex-1"
                  />
                  <input
                    type="number"
                    value={newSkillDefault}
                    onChange={(e) => setNewSkillDefault(e.target.value)}
                    min={0}
                    max={99}
                    placeholder="Default"
                    className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => handleAddSkill(group.id)}
                    disabled={createSkill.isPending}
                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAddingSkillToGroup(null)}
                    className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingSkillToGroup(group.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium pt-2"
                >
                  + Add Skill
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Roles Tab ──────────────────────────────────────────
function RolesTab() {
  const { data: roles, isLoading } = usePlayerRoleDefinitions();
  const createRole = useCreatePlayerRoleDefinition();
  const updateRole = useUpdatePlayerRoleDefinition();
  const deleteRole = useDeletePlayerRoleDefinition();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState<Position | ''>('');
  const [newDescription, setNewDescription] = useState('');
  const [editingRole, setEditingRole] = useState<PlayerRoleDefinition | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState<Position | ''>('');
  const [editDescription, setEditDescription] = useState('');

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  // Group by position
  const grouped = POSITIONS.map((pos) => ({
    position: pos,
    roles: roles?.filter((r) => r.position === pos) ?? [],
  })).filter((g) => g.roles.length > 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPosition) return;
    createRole.mutate(
      { name: newName.trim(), position: newPosition, description: newDescription || undefined },
      {
        onSuccess: () => {
          setNewName('');
          setNewPosition('');
          setNewDescription('');
          setAdding(false);
        },
      },
    );
  };

  const handleEdit = (role: PlayerRoleDefinition) => {
    setEditingRole(role);
    setEditName(role.name);
    setEditPosition(role.position);
    setEditDescription(role.description ?? '');
  };

  const handleSave = () => {
    if (!editingRole || !editPosition) return;
    updateRole.mutate(
      {
        id: editingRole.id,
        name: editName,
        position: editPosition,
        description: editDescription || undefined,
      },
      { onSuccess: () => setEditingRole(null) },
    );
  };

  return (
    <div className="space-y-4">
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Add Role
        </button>
      ) : (
        <form onSubmit={handleAdd} className="flex gap-2 items-end">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Role name"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={newPosition}
            onChange={(e) => setNewPosition(e.target.value as Position)}
            required
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Position</option>
            {POSITIONS.map((pos) => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
          />
          <button type="submit" disabled={createRole.isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Add
          </button>
          <button type="button" onClick={() => setAdding(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
            Cancel
          </button>
        </form>
      )}

      {grouped.map(({ position, roles: posRoles }) => (
        <div key={position} className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">{position}</h3>
          </div>
          <div className="p-4 space-y-2">
            {posRoles.map((role) => (
              <div key={role.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                {editingRole?.id === role.id ? (
                  <div className="flex gap-2 flex-1">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm flex-1" />
                    <select value={editPosition} onChange={(e) => setEditPosition(e.target.value as Position)} className="rounded border border-gray-300 px-2 py-1 text-sm">
                      {POSITIONS.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                    <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" className="rounded border border-gray-300 px-2 py-1 text-sm flex-1" />
                    <button onClick={handleSave} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Save</button>
                    <button onClick={() => setEditingRole(null)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Cancel</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{role.name}</span>
                      {role.description && <span className="text-xs text-gray-500 ml-2">{role.description}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(role)} className="text-xs text-indigo-600 hover:text-indigo-700">Edit</button>
                      <button onClick={() => { if (confirm(`Delete role "${role.name}"?`)) deleteRole.mutate(role.id); }} className="text-xs text-red-600 hover:text-red-700">Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Play Styles Tab ────────────────────────────────────
function PlayStylesTab() {
  const { data: styles, isLoading } = usePlayStyleDefinitions();
  const createStyle = useCreatePlayStyleDefinition();
  const updateStyle = useUpdatePlayStyleDefinition();
  const deleteStyle = useDeletePlayStyleDefinition();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState<Position | ''>('');
  const [newDescription, setNewDescription] = useState('');
  const [newIconUrl, setNewIconUrl] = useState('');
  const [editingStyle, setEditingStyle] = useState<PlayStyleDefinition | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState<Position | ''>('');
  const [editDescription, setEditDescription] = useState('');
  const [editIconUrl, setEditIconUrl] = useState('');

  if (isLoading) return <p className="text-gray-500">Loading...</p>;

  const grouped = POSITIONS.map((pos) => ({
    position: pos,
    styles: styles?.filter((s) => s.position === pos) ?? [],
  })).filter((g) => g.styles.length > 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPosition) return;
    createStyle.mutate(
      {
        name: newName.trim(),
        position: newPosition,
        description: newDescription || undefined,
        iconUrl: newIconUrl || undefined,
      },
      {
        onSuccess: () => {
          setNewName('');
          setNewPosition('');
          setNewDescription('');
          setNewIconUrl('');
          setAdding(false);
        },
      },
    );
  };

  const handleEdit = (style: PlayStyleDefinition) => {
    setEditingStyle(style);
    setEditName(style.name);
    setEditPosition(style.position);
    setEditDescription(style.description ?? '');
    setEditIconUrl(style.iconUrl ?? '');
  };

  const handleSave = () => {
    if (!editingStyle || !editPosition) return;
    updateStyle.mutate(
      {
        id: editingStyle.id,
        name: editName,
        position: editPosition,
        description: editDescription || undefined,
        iconUrl: editIconUrl || undefined,
      },
      { onSuccess: () => setEditingStyle(null) },
    );
  };

  return (
    <div className="space-y-4">
      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Add Play Style
        </button>
      ) : (
        <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Style name" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={newPosition} onChange={(e) => setNewPosition(e.target.value as Position)} required className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Position</option>
            {POSITIONS.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
          </select>
          <input type="text" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1" />
          <input type="url" value={newIconUrl} onChange={(e) => setNewIconUrl(e.target.value)} placeholder="Icon URL" className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" disabled={createStyle.isPending} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">Add</button>
          <button type="button" onClick={() => setAdding(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
        </form>
      )}

      {grouped.map(({ position, styles: posStyles }) => (
        <div key={position} className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">{position}</h3>
          </div>
          <div className="p-4 space-y-2">
            {posStyles.map((style) => (
              <div key={style.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                {editingStyle?.id === style.id ? (
                  <div className="flex gap-2 flex-1 flex-wrap">
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-sm" />
                    <select value={editPosition} onChange={(e) => setEditPosition(e.target.value as Position)} className="rounded border border-gray-300 px-2 py-1 text-sm">
                      {POSITIONS.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                    <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" className="rounded border border-gray-300 px-2 py-1 text-sm flex-1" />
                    <input type="url" value={editIconUrl} onChange={(e) => setEditIconUrl(e.target.value)} placeholder="Icon URL" className="rounded border border-gray-300 px-2 py-1 text-sm" />
                    <button onClick={handleSave} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Save</button>
                    <button onClick={() => setEditingStyle(null)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Cancel</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{style.name}</span>
                      {style.description && <span className="text-xs text-gray-500 ml-2">{style.description}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(style)} className="text-xs text-indigo-600 hover:text-indigo-700">Edit</button>
                      <button onClick={() => { if (confirm(`Delete play style "${style.name}"?`)) deleteStyle.mutate(style.id); }} className="text-xs text-red-600 hover:text-red-700">Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
