'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Employee } from '@/types';
import { getAllEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeSubordinates } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Navbar from '@/components/layout/Navbar';
import { FaUserFriends, FaUserTie, FaChartPie, FaSearch, FaChevronRight, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalSubordinatesCount, setTotalSubordinatesCount] = useState(0);
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: '',
    position: '',
    managerId: null
  });
  const [alert, setAlert] = useState<{ type: 'info' | 'success' | 'error' | 'warning'; message: string } | null>(null);

  const fetchEmployees = async () => {
    try {
      const response = await getAllEmployees(currentPage, pageSize);
      setEmployees(response.employees || []);
      setFilteredEmployees(response.employees || []);
      setTotalPages(Math.ceil(response.total / pageSize));
      setTotalCount(response.total);
      setTotalSubordinatesCount(response.totalSubordinatesCount || 0);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchEmployees();
    }
  }, [status, router, currentPage]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleEmployeeClick = async (employee: Employee) => {
    try {
      const response = await getEmployeeSubordinates(employee.id);
      if (response.subordinates && response.subordinates.length > 0) {
        setSelectedEmployee(response);
        setIsModalOpen(true);
      } else {
        setAlert({ type: 'info', message: 'This employee has no subordinates' });
      }
    } catch (err) {
      console.error('Error fetching subordinates:', err);
      setAlert({ type: 'error', message: 'Failed to load employee subordinates' });
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmployee(newEmployee);
      setIsCreateModalOpen(false);
      setNewEmployee({ name: '', position: '', managerId: null });
      fetchEmployees();
    } catch (err) {
      console.error('Error creating employee:', err);
      setError('Failed to create employee');
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      const updateData = {
        name: selectedEmployee.name,
        position: selectedEmployee.position,
        managerId: selectedEmployee.managerId
      };
      await updateEmployee(selectedEmployee.id, updateData);
      setIsEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error('Error updating employee:', err);
      setError('Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await deleteEmployee(id);
      fetchEmployees();
    } catch (err) {
      console.error('Error deleting employee:', err);
      setError('Failed to delete employee');
    }
  };

  const renderSubordinates = (employee: Employee) => {
    return (
      <div key={employee.id} className="ml-4 border-l-2 border-gray-200 pl-4">
        <div className="flex items-center p-3 rounded-lg bg-white border border-gray-200 mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
            <p className="text-sm text-gray-600">{employee.position}</p>
          </div>
          {employee.subordinates && employee.subordinates.length > 0 && (
            <div className="text-sm text-gray-500">
              {employee.subordinates.length} {employee.subordinates.length === 1 ? 'subordinate' : 'subordinates'}
            </div>
          )}
        </div>
        {employee.subordinates && employee.subordinates.map(sub => renderSubordinates(sub))}
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  const managerIds = new Set(employees.map(emp => emp.managerId).filter(id => id !== null));
  const mainManager = employees.find(emp => emp.managerId === null);
  const managerCount = managerIds.size + (mainManager ? 1 : 0);
  const nonManagerCount = totalCount - managerCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-primary-100 text-primary-600">
                <FaUserFriends className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Employees</h3>
                <p className="text-2xl font-semibold text-gray-900">{totalCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FaUserTie className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total Subordinates</h3>
                <p className="text-2xl font-semibold text-gray-900">{totalSubordinatesCount}</p>
                <p className="text-sm text-gray-500 mt-1">subordinates in total</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FaChartPie className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Individual Contributors</h3>
                <p className="text-2xl font-semibold text-gray-900">{nonManagerCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Add Employee */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search employees by name or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            className="ml-4"
          >
            <FaPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Employee List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Employee List</h2>
          <div className="space-y-2">
            {filteredEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div
                  onClick={() => handleEmployeeClick(employee)}
                  className="flex-1 cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.position}</p>
                </div>
                <div className="flex items-center space-x-4">
                  {employee.subordinates && employee.subordinates.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {employee.subordinates.length} {employee.subordinates.length === 1 ? 'subordinate' : 'subordinates'}
                    </span>
                  )}
                  <Button
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsEditModalOpen(true);
                    }}
                    variant="secondary"
                    size="sm"
                    className="text-gray-400 hover:text-primary-600"
                    title="Edit employee"
                  >
                    <FaEdit className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteEmployee(employee.id)}
                    variant="danger"
                    size="sm"
                    className="text-gray-400 hover:text-red-600"
                    title="Delete employee"
                  >
                    <FaTrash className="h-5 w-5" />
                  </Button>
                  <FaChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
              >
                Next
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalCount)}
                  </span>{' '}
                  of <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="secondary"
                    size="sm"
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      variant={currentPage === page ? "primary" : "secondary"}
                      size="sm"
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === page
                          ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="secondary"
                    size="sm"
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        </Card>

        {/* View Subordinates Modal */}
        {isModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      {selectedEmployee.name}
                      {typeof selectedEmployee.totalSubordinatesCount === 'number' && (
                        <span className="text-base text-gray-500 font-normal">
                          ({selectedEmployee.totalSubordinatesCount} subordinates)
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">{selectedEmployee.position}</p>
                  </div>
                  <Button
                    onClick={() => setIsModalOpen(false)}
                    variant="secondary"
                    size="sm"
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  {selectedEmployee.subordinates && selectedEmployee.subordinates.length > 0 ? (
                    <div className="space-y-4">
                      {selectedEmployee.subordinates.map(sub => renderSubordinates(sub))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No subordinates found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Employee Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Add New Employee</h2>
                  <Button
                    onClick={() => setIsCreateModalOpen(false)}
                    variant="secondary"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <form onSubmit={handleCreateEmployee} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="name"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position</label>
                    <input
                      type="text"
                      id="position"
                      value={newEmployee.position}
                      onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="manager" className="block text-sm font-medium text-gray-700">Manager</label>
                    <select
                      id="manager"
                      value={newEmployee.managerId || ''}
                      onChange={(e) => setNewEmployee({ ...newEmployee, managerId: e.target.value ? Number(e.target.value) : null })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">No Manager</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      Create
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Employee Modal */}
        {isEditModalOpen && selectedEmployee && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Employee</h2>
                  <Button
                    onClick={() => setIsEditModalOpen(false)}
                    variant="secondary"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <form onSubmit={handleUpdateEmployee} className="space-y-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      id="edit-name"
                      value={selectedEmployee.name}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-position" className="block text-sm font-medium text-gray-700">Position</label>
                    <input
                      type="text"
                      id="edit-position"
                      value={selectedEmployee.position}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, position: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-manager" className="block text-sm font-medium text-gray-700">Manager</label>
                    <select
                      id="edit-manager"
                      value={selectedEmployee.managerId || ''}
                      onChange={(e) => setSelectedEmployee({ ...selectedEmployee, managerId: e.target.value ? Number(e.target.value) : null })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">No Manager</option>
                      {employees
                        .filter(emp => emp.id !== selectedEmployee.id)
                        .map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}