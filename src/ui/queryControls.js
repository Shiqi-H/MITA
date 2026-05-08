const SUBMIT_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.4 20.4 21 12 3.4 3.6l1.2 6.5 8.4 1.9-8.4 1.9-1.2 6.5Z"></path>
  </svg>
`;

const SPEAK_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"></path>
    <path d="M5 11a7 7 0 0 0 14 0"></path>
    <path d="M12 18v3"></path>
  </svg>
`;

export function renderQueryControls(container, { placeholder, onSubmit, onSpeak }) {
  container.innerHTML = '';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.autocomplete = 'off';

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'icon-button';
  submit.setAttribute('aria-label', 'Submit query');
  submit.title = 'Submit';
  submit.innerHTML = SUBMIT_ICON;

  const speak = document.createElement('button');
  speak.type = 'button';
  speak.className = 'icon-button';
  speak.setAttribute('aria-label', 'Speak query');
  speak.title = 'Speak';
  speak.innerHTML = SPEAK_ICON;

  const submitValue = () => {
    const value = input.value.trim();
    if (value) onSubmit(value);
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') submitValue();
  });
  submit.addEventListener('click', submitValue);
  speak.addEventListener('click', () => onSpeak(input, speak));

  container.append(input, submit, speak);
  return { input, submit, speak };
}
