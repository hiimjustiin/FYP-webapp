import { useState, useEffect } from "react";
import { adminService, type AdminUser } from "../services/adminService";
import DashboardLayout from "../components/layout/DashboardLayout";
import Button from "../components/ui/Button/Button";
import InputField from "../components/ui/InputField/InputField";
import Dropdown from "../components/ui/Dropdown/Dropdown";
import Table from "../components/ui/Table/Table";
import SearchBar from "../components/ui/SearchBar/SearchBar";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await adminService.getUsers({
        page,
        limit: 20,
        role: roleFilter !== "all" ? roleFilter : undefined,
        search: searchTerm || undefined,
      });
      setUsers(result.items);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await adminService.deleteUser(userId);
      loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await adminService.updateUser(user.id, { is_active: !user.is_active });
      loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const roleOptions = [
    { id: "all", label: "All Roles" },
    { id: "student", label: "Students" },
    { id: "instructor", label: "Instructors" },
    { id: "admin", label: "Admins" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage all platform users and their roles
            </p>
          </div>
          <Button variant="blue" onClick={() => setShowCreateModal(true)}>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create User
          </Button>
        </div>

        {/* Filters */}
        <div className="dashboard-card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search by name or email..."
                onSearch={handleSearch}
              />
            </div>
            <div className="w-full md:w-48">
              <Dropdown
                options={roleOptions}
                selectedOption={
                  roleOptions.find((opt) => opt.id === roleFilter) || null
                }
                onSelect={(option) => {
                  setRoleFilter(option.id);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div className="dashboard-card">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#181C62] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            <>
              <Table
                data={[
                  [
                    "Name",
                    "Email",
                    "Role",
                    "Student ID",
                    "Department",
                    "Status",
                    "Joined",
                    "Actions",
                  ],
                  ...users.map((user) => [
                    user.display_name || "N/A",
                    user.email,
                    user.role,
                    user.student_id || "N/A",
                    user.department || "N/A",
                    user.is_active ? "Active" : "Inactive",
                    new Date(user.created_at).toLocaleDateString(),
                    <div className="flex gap-2" key={user.id}>
                      <Button
                        variant="blue"
                        onClick={() => setEditingUser(user)}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant={user.is_active ? "grey" : "green"}
                        onClick={() => handleToggleActive(user)}
                        className="text-xs"
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="red"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-xs"
                      >
                        Delete
                      </Button>
                    </div>,
                  ]),
                ]}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="grey"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="grey"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {(showCreateModal || editingUser) && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            loadUsers();
            setShowCreateModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

// User Create/Edit Modal Component
function UserModal({
  user,
  onClose,
  onSave,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    email: user?.email || "",
    password: "",
    display_name: user?.display_name || "",
    role: user?.role || "student",
    student_id: user?.student_id || "",
    department: user?.department || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (user) {
        // Update existing user
        await adminService.updateUser(user.id, {
          display_name: formData.display_name,
          role: formData.role as "student" | "instructor" | "admin",
          student_id: formData.student_id,
          department: formData.department,
          phone: formData.phone,
        });
      } else {
        // Create new user
        if (!formData.password) {
          setError("Password is required for new users");
          setSaving(false);
          return;
        }
        await adminService.createUser({
          email: formData.email,
          password: formData.password,
          display_name: formData.display_name,
          role: formData.role as "student" | "instructor" | "admin",
          student_id: formData.student_id,
          department: formData.department,
          phone: formData.phone,
        });
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {user ? "Edit User" : "Create New User"}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value: string) =>
              setFormData({ ...formData, email: value })
            }
            disabled={!!user}
            required
          />

          {!user && (
            <InputField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(value: string) =>
                setFormData({ ...formData, password: value })
              }
              required
            />
          )}

          <InputField
            label="Display Name"
            value={formData.display_name}
            onChange={(value: string) =>
              setFormData({ ...formData, display_name: value })
            }
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <Dropdown
              options={[
                { id: "student", label: "Student" },
                { id: "instructor", label: "Instructor" },
                { id: "admin", label: "Admin" },
              ]}
              selectedOption={{
                id: formData.role,
                label:
                  formData.role.charAt(0).toUpperCase() +
                  formData.role.slice(1),
              }}
              onSelect={(option) =>
                setFormData({
                  ...formData,
                  role: option.id as "student" | "instructor" | "admin",
                })
              }
            />
          </div>

          <InputField
            label="Student ID"
            value={formData.student_id}
            onChange={(value: string) =>
              setFormData({ ...formData, student_id: value })
            }
          />

          <InputField
            label="Department"
            value={formData.department}
            onChange={(value: string) =>
              setFormData({ ...formData, department: value })
            }
          />

          <InputField
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(value: string) =>
              setFormData({ ...formData, phone: value })
            }
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="blue"
              disabled={saving}
              className="flex-1"
            >
              {saving ? "Saving..." : user ? "Update User" : "Create User"}
            </Button>
            <Button
              type="button"
              variant="grey"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
