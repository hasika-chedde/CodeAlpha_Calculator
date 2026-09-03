/* ============================================================
   SIMPLE CALCULATOR — script.js
   No eval(): every calculation is done with plain arithmetic
   based on the operator symbol that was pressed.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Element references ----
  const expressionEl = document.getElementById('expression');
  const currentEl = document.getElementById('current');
  const keys = document.querySelectorAll('.key');

  // ---- Calculator state ----
  let currentOperand = '0';   // the number currently being typed
  let previousOperand = '';   // the number before the operator was pressed
  let operator = null;        // '+', '−', '×', or '÷'
  let justEvaluated = false;  // true right after "=" was pressed
  let isError = false;        // true after a division-by-zero error

  const MAX_DIGITS = 14; // keeps very long numbers from overflowing the display

  /* ============================================================
     DISPLAY
     ============================================================ */
  function updateDisplay() {
    currentEl.classList.toggle('is-error', isError);

    if (isError) {
      currentEl.textContent = 'Error';
      expressionEl.textContent = '';
      return;
    }

    currentEl.textContent = formatForDisplay(currentOperand);

    // Show "12 +" above the current number while an operation is pending
    expressionEl.textContent = operator
      ? `${formatForDisplay(previousOperand)} ${operator}`
      : '';
  }

  // Adds thousands separators without touching the underlying value
  function formatForDisplay(value) {
    if (value === '' || value === undefined) return '';
    if (value === '-') return '-';

    const [intPart, decPart] = value.split('.');
    const formattedInt = new Intl.NumberFormat('en-US').format(Number(intPart));
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  }

  /* ============================================================
     STATE-CHANGING ACTIONS
     ============================================================ */
  function inputNumber(digit) {
    if (isError) resetAfterError();

    // Starting fresh after "=" begins a brand new number
    if (justEvaluated) {
      currentOperand = digit;
      justEvaluated = false;
      return;
    }

    if (currentOperand.replace('-', '').length >= MAX_DIGITS) return;

    currentOperand = currentOperand === '0' ? digit : currentOperand + digit;
  }

  function inputDecimal() {
    if (isError) resetAfterError();

    if (justEvaluated) {
      currentOperand = '0.';
      justEvaluated = false;
      return;
    }

    // Prevent a second decimal point in the same number
    if (currentOperand.includes('.')) return;
    currentOperand += '.';
  }

  function chooseOperator(nextOperator) {
    if (isError) resetAfterError();

    // If an operator is already pending, resolve it first so users
    // can chain calculations like 5 + 3 + 2
    if (operator && !justEvaluated) {
      evaluate();
    }

    previousOperand = currentOperand;
    operator = nextOperator;
    currentOperand = '0';
    justEvaluated = false;

    highlightActiveOperator(nextOperator);
  }

  function highlightActiveOperator(activeOp) {
    document.querySelectorAll('.key--op').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.operator === activeOp);
    });
  }

  function evaluate() {
    if (operator === null || justEvaluated) return;

    const prev = parseFloat(previousOperand);
    const curr = parseFloat(currentOperand);

    if (isNaN(prev) || isNaN(curr)) return;

    let result;
    switch (operator) {
      case '+':
        result = prev + curr;
        break;
      case '−':
        result = prev - curr;
        break;
      case '×':
        result = prev * curr;
        break;
      case '÷':
        if (curr === 0) {
          triggerError();
          return;
        }
        result = prev / curr;
        break;
      default:
        return;
    }

    // Round away tiny floating-point errors (e.g. 0.1 + 0.2)
    result = Math.round((result + Number.EPSILON) * 1e10) / 1e10;

    currentOperand = String(result);
    previousOperand = '';
    operator = null;
    justEvaluated = true;
    highlightActiveOperator(null);
  }

  function applyPercent() {
    if (isError) resetAfterError();
    const value = parseFloat(currentOperand);
    if (isNaN(value)) return;
    currentOperand = String(value / 100);
  }

  function backspace() {
    if (isError) {
      resetAfterError();
      return;
    }
    if (justEvaluated) return; // don't edit a freshly computed result

    currentOperand = currentOperand.length > 1
      ? currentOperand.slice(0, -1)
      : '0';
  }

  function clearAll() {
    currentOperand = '0';
    previousOperand = '';
    operator = null;
    justEvaluated = false;
    isError = false;
    highlightActiveOperator(null);
  }

  function triggerError() {
    isError = true;
    currentOperand = '0';
    previousOperand = '';
    operator = null;
    justEvaluated = false;
    highlightActiveOperator(null);
  }

  function resetAfterError() {
    isError = false;
    currentOperand = '0';
  }

  /* ============================================================
     BUTTON CLICK HANDLING
     ============================================================ */
  keys.forEach((key) => {
    key.addEventListener('click', () => {
      const { action, value, operator: opValue } = key.dataset;

      switch (action) {
        case 'number':
          inputNumber(value);
          break;
        case 'decimal':
          inputDecimal();
          break;
        case 'operator':
          chooseOperator(opValue);
          break;
        case 'equals':
          evaluate();
          break;
        case 'clear':
          clearAll();
          break;
        case 'backspace':
          backspace();
          break;
        case 'percent':
          applyPercent();
          break;
      }

      updateDisplay();
    });
  });

  /* ============================================================
     KEYBOARD SUPPORT
     ============================================================ */
  const keyOperatorMap = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷',
  };

  document.addEventListener('keydown', (e) => {
    // Digits 0-9
    if (e.key >= '0' && e.key <= '9') {
      inputNumber(e.key);
      updateDisplay();
      return;
    }

    if (e.key === '.') {
      inputDecimal();
      updateDisplay();
      return;
    }

    if (keyOperatorMap[e.key]) {
      e.preventDefault(); // stop "/" from triggering the browser's quick-find
      chooseOperator(keyOperatorMap[e.key]);
      updateDisplay();
      return;
    }

    if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      evaluate();
      updateDisplay();
      return;
    }

    if (e.key === 'Backspace') {
      backspace();
      updateDisplay();
      return;
    }

    if (e.key === 'Escape') {
      clearAll();
      updateDisplay();
      return;
    }

    if (e.key === '%') {
      applyPercent();
      updateDisplay();
    }
  });

  // ---- Initial render ----
  updateDisplay();
});
