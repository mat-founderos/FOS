window.onload = function () {
  const firstname = document.querySelector('#firstname');
  const lastname = document.querySelector('#lastname');
  const nameField = document.querySelector('#name');

  function updateFullName() {
    const first = firstname?.value.trim() || '';
    const last = lastname?.value.trim() || '';
    const fullName = [first, last].filter(Boolean).join(' ');
    if (nameField) nameField.value = fullName;
  }

  // Run once
  updateFullName();

  // Run on input
  if (firstname) firstname.addEventListener('input', updateFullName);
  if (lastname) lastname.addEventListener('input', updateFullName);
};
