const STORAGE_KEY = 'studentManagementData';
const formState = {
  editingStudentId: null,
};

let students = [];
let notificationTimer = null;

const elements = {};

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  cacheElements();
  bindEventListeners();
  loadStudents();
  initializeFormDefaults();
  renderDashboardStatistics();
  renderStudents();
}

function cacheElements() {
  elements.form = document.getElementById('studentForm');
  elements.studentId = document.getElementById('studentId');
  elements.fullName = document.getElementById('fullName');
  elements.email = document.getElementById('email');
  elements.phone = document.getElementById('phone');
  elements.gender = document.getElementById('gender');
  elements.department = document.getElementById('department');
  elements.registrationDate = document.getElementById('registrationDate');
  elements.status = document.getElementById('status');
  elements.formError = document.getElementById('formError');
  elements.submitBtn = document.getElementById('submitBtn');
  elements.resetFormBtn = document.getElementById('resetFormBtn');
  elements.cancelEditBtn = document.getElementById('cancelEditBtn');
  elements.formTitle = document.getElementById('formTitle');
  elements.searchInput = document.getElementById('searchInput');
  elements.departmentFilter = document.getElementById('departmentFilter');
  elements.statusFilter = document.getElementById('statusFilter');
  elements.clearFiltersBtn = document.getElementById('clearFiltersBtn');
  elements.studentTableBody = document.getElementById('studentTableBody');
  elements.emptyState = document.getElementById('emptyState');
  elements.emptyStateBtn = document.getElementById('emptyStateBtn');
  elements.currentDate = document.getElementById('currentDate');
  elements.newStudentBtn = document.getElementById('newStudentBtn');
  elements.notification = document.getElementById('notification');
  elements.studentModal = document.getElementById('studentModal');
  elements.studentDetailContent = document.getElementById('studentDetailContent');
  elements.mobileMenuToggle = document.getElementById('mobileMenuToggle');
  elements.navItems = Array.from(document.querySelectorAll('.nav-item'));
}

function bindEventListeners() {
  elements.form.addEventListener('submit', handleFormSubmit);
  elements.resetFormBtn.addEventListener('click', () => resetForm());
  elements.cancelEditBtn.addEventListener('click', () => resetForm());
  elements.searchInput.addEventListener('input', renderStudents);
  elements.departmentFilter.addEventListener('change', renderStudents);
  elements.statusFilter.addEventListener('change', renderStudents);
  elements.clearFiltersBtn.addEventListener('click', clearFilters);
  elements.newStudentBtn.addEventListener('click', () => {
    document.getElementById('register').scrollIntoView({ behavior: 'smooth', block: 'start' });
    resetForm();
  });
  elements.emptyStateBtn.addEventListener('click', () => {
    document.getElementById('register').scrollIntoView({ behavior: 'smooth', block: 'start' });
    resetForm();
  });
  elements.mobileMenuToggle.addEventListener('click', toggleSidebar);

  elements.navItems.forEach((navItem) => {
    navItem.addEventListener('click', () => {
      const targetId = navItem.dataset.target;
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      elements.navItems.forEach((item) => item.classList.toggle('active', item === navItem));
      if (window.innerWidth <= 860) {
        document.body.classList.remove('sidebar-open');
        elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  elements.studentModal.addEventListener('click', (event) => {
    const closeTarget = event.target.closest('[data-close="modal"]');
    if (closeTarget || event.target === elements.studentModal) {
      closeStudentModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.studentModal.classList.contains('hidden')) {
      closeStudentModal();
    }
  });
}

function initializeFormDefaults() {
  const today = new Date();
  elements.studentId.value = generateStudentId();
  elements.registrationDate.value = formatDateInput(today);
  elements.gender.value = 'Male';
  elements.status.value = 'Active';
  updateCurrentDate();
}

function updateCurrentDate() {
  const now = new Date();
  const formatted = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(now);
  elements.currentDate.textContent = formatted;
}

function handleFormSubmit(event) {
  event.preventDefault();

  const studentData = {
    studentId: elements.studentId.value.trim(),
    fullName: elements.fullName.value.trim(),
    email: elements.email.value.trim(),
    phone: elements.phone.value.trim(),
    gender: elements.gender.value,
    department: elements.department.value,
    registrationDate: elements.registrationDate.value,
    status: elements.status.value,
  };

  const validationResult = validateStudentForm(studentData);
  if (!validationResult.valid) {
    showFormMessage(validationResult.message);
    return;
  }

  if (formState.editingStudentId) {
    updateStudent(studentData);
    return;
  }

  addStudent(studentData);
}

function addStudent(studentData) {
  const newStudent = {
    ...studentData,
    studentId: studentData.studentId || generateStudentId(),
    fullName: studentData.fullName.trim(),
    email: studentData.email.trim(),
    phone: studentData.phone.trim(),
  };

  students.push(newStudent);
  saveStudents();
  renderDashboardStatistics();
  renderStudents();
  resetForm();
  showNotification('Student registered successfully.', 'success');
}

function updateStudent(studentData) {
  const index = students.findIndex((student) => student.studentId === formState.editingStudentId);
  if (index === -1) {
    showNotification('The selected student could not be found.', 'error');
    return;
  }

  students[index] = {
    ...students[index],
    ...studentData,
    studentId: formState.editingStudentId,
    fullName: studentData.fullName.trim(),
    email: studentData.email.trim(),
    phone: studentData.phone.trim(),
  };

  saveStudents();
  renderDashboardStatistics();
  renderStudents();
  resetForm();
  showNotification('Student information updated successfully.', 'success');
}

function deleteStudent(studentId) {
  const student = students.find((item) => item.studentId === studentId);
  if (!student) {
    showNotification('The selected student could not be found.', 'error');
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to delete ${student.fullName}'s record? This action is permanent for this local demonstration.`
  );

  if (!confirmed) {
    return;
  }

  students = students.filter((item) => item.studentId !== studentId);
  saveStudents();
  renderDashboardStatistics();
  renderStudents();

  if (formState.editingStudentId === studentId) {
    resetForm();
  }

  showNotification(`${student.fullName} was removed from the directory.`, 'warning');
}

function resetForm() {
  formState.editingStudentId = null;
  elements.form.reset();
  elements.studentId.value = generateStudentId();
  elements.gender.value = 'Male';
  elements.status.value = 'Active';
  elements.registrationDate.value = formatDateInput(new Date());
  elements.formTitle.textContent = 'Register New Student';
  elements.submitBtn.textContent = 'Add Student';
  elements.cancelEditBtn.classList.add('hidden');
  clearFormMessage();
}

function validateStudentForm(studentData) {
  const trimmedFullName = studentData.fullName.trim();
  const trimmedEmail = studentData.email.trim();
  const trimmedPhone = studentData.phone.trim();

  if (!trimmedFullName) {
    return { valid: false, message: 'Full name is required.' };
  }

  if (!trimmedEmail) {
    return { valid: false, message: 'Email address is required.' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }

  if (!trimmedPhone) {
    return { valid: false, message: 'Phone number is required.' };
  }

  const digits = trimmedPhone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return { valid: false, message: 'Phone number must contain between 7 and 15 digits.' };
  }

  if (!studentData.department) {
    return { valid: false, message: 'Please select a department.' };
  }

  if (!studentData.registrationDate) {
    return { valid: false, message: 'Registration date is required.' };
  }

  const enteredDate = new Date(studentData.registrationDate);
  if (Number.isNaN(enteredDate.getTime())) {
    return { valid: false, message: 'Please enter a valid registration date.' };
  }

  const normalizedEmail = trimmedEmail.toLowerCase();
  const duplicateStudent = students.find((student) => {
    if (student.studentId === formState.editingStudentId) {
      return false;
    }
    return student.email.trim().toLowerCase() === normalizedEmail;
  });

  if (duplicateStudent) {
    return { valid: false, message: 'A student with this email address is already registered.' };
  }

  return { valid: true, message: '' };
}

function clearFormMessage() {
  elements.formError.textContent = '';
}

function showFormMessage(message) {
  elements.formError.textContent = message;
}

function loadStudents() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      students = [];
      return;
    }

    const parsedData = JSON.parse(rawData);
    if (!Array.isArray(parsedData)) {
      throw new Error('Stored data is not an array.');
    }

    students = parsedData.filter(Boolean);
  } catch (error) {
    console.warn('Unable to load student data from LocalStorage:', error);
    students = [];
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function generateStudentId() {
  let nextNumber = 1001;

  if (students.length > 0) {
    const existingNumbers = students
      .map((student) => Number(String(student.studentId).replace(/\D/g, '')))
      .filter((value) => Number.isFinite(value));

    if (existingNumbers.length > 0) {
      nextNumber = Math.max(...existingNumbers) + 1;
    }
  }

  return `STU-${nextNumber}`;
}

function renderDashboardStatistics() {
  const totalStudents = students.length;
  const departments = new Set(students.map((student) => student.department)).size;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const newRegistrations = students.filter((student) => {
    const date = new Date(student.registrationDate);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
  }).length;

  const activeStudents = students.filter((student) => student.status === 'Active').length;

  document.getElementById('totalStudents').textContent = String(totalStudents);
  document.getElementById('totalDepartments').textContent = String(departments);
  document.getElementById('newRegistrations').textContent = String(newRegistrations);
  document.getElementById('activeStudents').textContent = String(activeStudents);
}

function renderStudents() {
  const filteredStudents = filterStudents();
  elements.studentTableBody.innerHTML = '';

  if (filteredStudents.length === 0) {
    elements.emptyState.hidden = false;
    return;
  }

  elements.emptyState.hidden = true;

  filteredStudents.forEach((student) => {
    const row = document.createElement('tr');

    const studentIdCell = document.createElement('td');
    studentIdCell.textContent = student.studentId;

    const nameCell = document.createElement('td');
    nameCell.textContent = student.fullName;

    const emailCell = document.createElement('td');
    emailCell.textContent = student.email;

    const phoneCell = document.createElement('td');
    phoneCell.textContent = student.phone;

    const departmentCell = document.createElement('td');
    departmentCell.textContent = student.department;

    const genderCell = document.createElement('td');
    genderCell.textContent = student.gender;

    const dateCell = document.createElement('td');
    dateCell.textContent = formatDisplayDate(student.registrationDate);

    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${student.status.toLowerCase()}`;
    statusBadge.textContent = student.status;
    statusCell.appendChild(statusBadge);

    const actionsCell = document.createElement('td');
    const actionWrap = document.createElement('div');
    actionWrap.className = 'table-actions';

    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.className = 'icon-btn view';
    viewButton.textContent = 'View';
    viewButton.setAttribute('aria-label', `View details for ${student.fullName}`);
    viewButton.addEventListener('click', () => viewStudentDetails(student.studentId));

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'icon-btn edit';
    editButton.textContent = 'Edit';
    editButton.setAttribute('aria-label', `Edit ${student.fullName}`);
    editButton.addEventListener('click', () => editStudent(student.studentId));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'icon-btn delete';
    deleteButton.textContent = 'Delete';
    deleteButton.setAttribute('aria-label', `Delete ${student.fullName}`);
    deleteButton.addEventListener('click', () => deleteStudent(student.studentId));

    actionWrap.append(viewButton, editButton, deleteButton);
    actionsCell.appendChild(actionWrap);

    row.append(
      studentIdCell,
      nameCell,
      emailCell,
      phoneCell,
      departmentCell,
      genderCell,
      dateCell,
      statusCell,
      actionsCell
    );

    elements.studentTableBody.appendChild(row);
  });
}

function searchStudents() {
  const searchTerm = elements.searchInput.value.trim().toLowerCase();
  const departmentFilter = elements.departmentFilter.value;
  const statusFilter = elements.statusFilter.value;

  return students.filter((student) => {
    const matchesSearch =
      !searchTerm ||
      student.fullName.toLowerCase().includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm) ||
      student.studentId.toLowerCase().includes(searchTerm);

    const matchesDepartment = !departmentFilter || student.department === departmentFilter;
    const matchesStatus = !statusFilter || student.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });
}

function filterStudents() {
  return searchStudents();
}

function clearFilters() {
  elements.searchInput.value = '';
  elements.departmentFilter.value = '';
  elements.statusFilter.value = '';
  renderStudents();
}

function viewStudentDetails(studentId) {
  const student = students.find((item) => item.studentId === studentId);
  if (!student) {
    showNotification('The selected student could not be found.', 'error');
    return;
  }

  elements.studentDetailContent.innerHTML = '';

  const detailItems = [
    { label: 'Student ID', value: student.studentId },
    { label: 'Full Name', value: student.fullName },
    { label: 'Email', value: student.email },
    { label: 'Phone Number', value: student.phone },
    { label: 'Gender', value: student.gender },
    { label: 'Department', value: student.department },
    { label: 'Registration Date', value: formatDisplayDate(student.registrationDate) },
    { label: 'Status', value: student.status },
  ];

  detailItems.forEach((detail) => {
    const item = document.createElement('div');
    item.className = 'detail-item';

    const label = document.createElement('span');
    label.textContent = detail.label;

    const value = document.createElement('strong');
    value.textContent = detail.value;

    item.append(label, value);
    elements.studentDetailContent.appendChild(item);
  });

  elements.studentModal.classList.remove('hidden');
}

function closeStudentModal() {
  elements.studentModal.classList.add('hidden');
}

function editStudent(studentId) {
  const student = students.find((item) => item.studentId === studentId);
  if (!student) {
    showNotification('The selected student could not be found.', 'error');
    return;
  }

  formState.editingStudentId = studentId;
  elements.studentId.value = student.studentId;
  elements.fullName.value = student.fullName;
  elements.email.value = student.email;
  elements.phone.value = student.phone;
  elements.gender.value = student.gender;
  elements.department.value = student.department;
  elements.registrationDate.value = student.registrationDate;
  elements.status.value = student.status;
  elements.formTitle.textContent = 'Edit Student Information';
  elements.submitBtn.textContent = 'Save Changes';
  elements.cancelEditBtn.classList.remove('hidden');
  clearFormMessage();

  document.getElementById('register').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showNotification(message, type) {
  elements.notification.textContent = message;
  elements.notification.className = `notification visible ${type}`;

  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }

  notificationTimer = setTimeout(() => {
    elements.notification.className = 'notification';
  }, 2800);
}

function toggleSidebar() {
  const isOpen = document.body.classList.toggle('sidebar-open');
  elements.mobileMenuToggle.setAttribute('aria-expanded', String(isOpen));
}

function formatDateInput(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(value);
}
