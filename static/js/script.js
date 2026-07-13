/**
 * CalcX — Modern Calculator Frontend
 * Communicates with Flask backend for calculations
 */

class Calculator {
    constructor() {
        this.expression = '';
        this.displayValue = '0';
        this.lastResult = null;
        this.isNewInput = true;
        this.history = [];
        this.historyOpen = false;
        this.mode = 'standard';

        this.init();
    }

    init() {
        // Cache DOM elements
        this.expressionEl = document.getElementById('expression');
        this.resultEl = document.getElementById('result');
        this.historyPanel = document.getElementById('historyPanel');
        this.historyList = document.getElementById('historyList');
        this.scientificPanel = document.getElementById('scientificPanel');
        this.modeToggle = document.getElementById('modeToggle');

        // Bind events
        this.bindButtons();
        this.bindKeyboard();
        this.bindModeToggle();
        this.bindHistory();
        this.addButtonEffects();
    }

    // --- Event Bindings ---

    bindButtons() {
        // Number buttons
        document.querySelectorAll('[data-action="number"]').forEach(btn => {
            btn.addEventListener('click', () => this.inputNumber(btn.dataset.value));
        });

        // Operator buttons
        document.querySelectorAll('[data-action="operator"]').forEach(btn => {
            btn.addEventListener('click', () => this.inputOperator(btn.dataset.value));
        });

        // Decimal
        document.getElementById('btnDecimal').addEventListener('click', () => this.inputDecimal());

        // Clear
        document.getElementById('btnClear').addEventListener('click', () => this.clear());

        // Parentheses
        document.getElementById('btnParenOpen').addEventListener('click', () => this.inputParen('('));
        document.getElementById('btnParenClose').addEventListener('click', () => this.inputParen(')'));

        // Equals
        document.getElementById('btnEquals').addEventListener('click', () => this.calculate());

        // Negate
        document.getElementById('btnNegate').addEventListener('click', () => this.negate());

        // Backspace
        document.getElementById('btnBackspace').addEventListener('click', () => this.backspace());

        // Scientific buttons
        document.querySelectorAll('[data-sci]').forEach(btn => {
            btn.addEventListener('click', () => this.scientificOp(btn.dataset.sci));
        });
    }

    bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            e.preventDefault();

            const key = e.key;

            if (/^[0-9]$/.test(key)) {
                this.inputNumber(key);
                this.flashButton(`btn${key}`);
            } else if (key === '.') {
                this.inputDecimal();
                this.flashButton('btnDecimal');
            } else if (key === '+') {
                this.inputOperator('+');
                this.flashButton('btnAdd');
            } else if (key === '-') {
                this.inputOperator('−');
                this.flashButton('btnSubtract');
            } else if (key === '*') {
                this.inputOperator('×');
                this.flashButton('btnMultiply');
            } else if (key === '/') {
                this.inputOperator('÷');
                this.flashButton('btnDivide');
            } else if (key === 'Enter' || key === '=') {
                this.calculate();
                this.flashButton('btnEquals');
            } else if (key === 'Backspace') {
                this.backspace();
                this.flashButton('btnBackspace');
            } else if (key === 'Escape' || key === 'Delete') {
                this.clear();
                this.flashButton('btnClear');
            } else if (key === '(') {
                this.inputParen('(');
                this.flashButton('btnParenOpen');
            } else if (key === ')') {
                this.inputParen(')');
                this.flashButton('btnParenClose');
            }
        });
    }

    bindModeToggle() {
        const standardBtn = document.getElementById('btnStandard');
        const scientificBtn = document.getElementById('btnScientific');

        standardBtn.addEventListener('click', () => this.setMode('standard'));
        scientificBtn.addEventListener('click', () => this.setMode('scientific'));
    }

    bindHistory() {
        document.getElementById('btnHistory').addEventListener('click', () => this.toggleHistory());
        document.getElementById('clearHistory').addEventListener('click', () => this.clearHistory());
    }

    addButtonEffects() {
        document.querySelectorAll('.btn').forEach(btn => {
            // Track mouse position for radial gradient effect
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                btn.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
                btn.style.setProperty('--y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
            });

            // Ripple effect
            btn.addEventListener('click', (e) => {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = `${size}px`;
                ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
                ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
                btn.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    // --- Calculator Logic ---

    inputNumber(num) {
        if (this.isNewInput) {
            this.displayValue = num;
            this.isNewInput = false;
        } else {
            if (this.displayValue === '0' && num !== '0') {
                this.displayValue = num;
            } else if (this.displayValue !== '0') {
                this.displayValue += num;
            }
        }
        this.expression += num;
        this.updateDisplay();
    }

    inputOperator(op) {
        const lastChar = this.expression.slice(-1);

        // Allow minus after opening paren or another operator for negative numbers
        if (this.expression === '' && op !== '−') return;
        if (this.expression === '' && op === '−') {
            this.expression = '−';
            this.displayValue = '-';
            this.isNewInput = false;
            this.updateDisplay();
            return;
        }

        // Replace last operator
        if (['+', '−', '×', '÷'].includes(lastChar)) {
            this.expression = this.expression.slice(0, -1) + op;
        } else {
            this.expression += op;
        }

        this.isNewInput = true;
        this.updateDisplay();
        this.highlightOperator(op);
    }

    inputDecimal() {
        if (this.isNewInput) {
            this.displayValue = '0.';
            this.expression += '0.';
            this.isNewInput = false;
        } else {
            // Check if current number already has a decimal
            const parts = this.expression.split(/[+\−×÷()]/);
            const currentNum = parts[parts.length - 1];
            if (!currentNum.includes('.')) {
                this.displayValue += '.';
                this.expression += '.';
            }
        }
        this.updateDisplay();
    }

    inputParen(paren) {
        this.expression += paren;
        this.isNewInput = paren === '(';
        this.updateDisplay();
    }

    negate() {
        if (this.displayValue !== '0') {
            if (this.displayValue.startsWith('-')) {
                this.displayValue = this.displayValue.slice(1);
            } else {
                this.displayValue = '-' + this.displayValue;
            }
            // Rebuild expression is complex — for now just negate the display
            this.updateDisplay();
        }
    }

    backspace() {
        if (this.expression.length > 0) {
            this.expression = this.expression.slice(0, -1);
            if (this.expression === '') {
                this.displayValue = '0';
                this.isNewInput = true;
            }
            this.updateDisplay();
        }
    }

    clear() {
        this.expression = '';
        this.displayValue = '0';
        this.isNewInput = true;
        this.lastResult = null;
        this.updateDisplay();
        this.clearOperatorHighlights();
    }

    async calculate() {
        if (!this.expression) return;

        this.resultEl.classList.add('computing');

        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expression: this.expression })
            });

            const data = await response.json();

            if (data.success) {
                const expr = this.expression;
                this.expressionEl.textContent = this.formatExpression(expr) + ' =';
                this.displayValue = data.result;
                this.lastResult = data.result;
                this.expression = data.result;
                this.isNewInput = true;

                this.resultEl.classList.remove('computing', 'error');
                this.resultEl.classList.add('pop');
                setTimeout(() => this.resultEl.classList.remove('pop'), 300);

                this.addToHistory(expr, data.result);
            } else {
                this.resultEl.classList.add('error');
                this.resultEl.classList.remove('computing');
                this.displayValue = data.error;
                this.isNewInput = true;
            }
        } catch (err) {
            this.resultEl.classList.add('error');
            this.resultEl.classList.remove('computing');
            this.displayValue = 'Connection error';
            this.isNewInput = true;
        }

        this.resultEl.textContent = this.displayValue;
        this.clearOperatorHighlights();
    }

    async scientificOp(operation) {
        // For pi and e, just insert the value
        if (operation === 'pi' || operation === 'e') {
            try {
                const response = await fetch('/api/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operation, value: 0 })
                });
                const data = await response.json();
                if (data.success) {
                    if (this.isNewInput) {
                        this.expression = data.result;
                    } else {
                        this.expression += data.result;
                    }
                    this.displayValue = data.result;
                    this.isNewInput = false;
                    this.updateDisplay();
                }
            } catch (err) {
                console.error(err);
            }
            return;
        }

        // Get current value
        let value;
        if (this.lastResult !== null && this.isNewInput) {
            value = parseFloat(this.lastResult);
        } else {
            value = parseFloat(this.displayValue) || 0;
        }

        this.resultEl.classList.add('computing');

        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ operation, value })
            });

            const data = await response.json();

            if (data.success) {
                const opLabel = this.getOperationLabel(operation, value);
                this.expressionEl.textContent = opLabel + ' =';
                this.displayValue = data.result;
                this.lastResult = data.result;
                this.expression = data.result;
                this.isNewInput = true;

                this.resultEl.classList.remove('computing', 'error');
                this.resultEl.classList.add('pop');
                setTimeout(() => this.resultEl.classList.remove('pop'), 300);

                this.addToHistory(opLabel, data.result);
            } else {
                this.resultEl.classList.add('error');
                this.resultEl.classList.remove('computing');
                this.displayValue = data.error;
                this.isNewInput = true;
            }
        } catch (err) {
            this.resultEl.classList.add('error');
            this.resultEl.classList.remove('computing');
            this.displayValue = 'Connection error';
            this.isNewInput = true;
        }

        this.resultEl.textContent = this.displayValue;
    }

    getOperationLabel(op, value) {
        const labels = {
            sin: `sin(${value})`,
            cos: `cos(${value})`,
            tan: `tan(${value})`,
            asin: `asin(${value})`,
            acos: `acos(${value})`,
            atan: `atan(${value})`,
            log: `log(${value})`,
            ln: `ln(${value})`,
            sqrt: `√(${value})`,
            cbrt: `∛(${value})`,
            square: `(${value})²`,
            cube: `(${value})³`,
            factorial: `${value}!`,
            abs: `|${value}|`,
            inv: `1/(${value})`,
            exp: `e^(${value})`,
            pow10: `10^(${value})`,
        };
        return labels[op] || `${op}(${value})`;
    }

    // --- Display ---

    updateDisplay() {
        this.expressionEl.textContent = this.formatExpression(this.expression);
        this.resultEl.textContent = this.displayValue;
        this.resultEl.classList.remove('error');

        // Auto-resize result text
        const len = this.displayValue.length;
        if (len > 16) {
            this.resultEl.style.fontSize = '1.4rem';
        } else if (len > 12) {
            this.resultEl.style.fontSize = '1.8rem';
        } else if (len > 8) {
            this.resultEl.style.fontSize = '2.2rem';
        } else {
            this.resultEl.style.fontSize = '';
        }
    }

    formatExpression(expr) {
        return expr
            .replace(/×/g, ' × ')
            .replace(/÷/g, ' ÷ ')
            .replace(/\+/g, ' + ')
            .replace(/−/g, ' − ');
    }

    highlightOperator(op) {
        this.clearOperatorHighlights();
        const map = { '+': 'btnAdd', '−': 'btnSubtract', '×': 'btnMultiply', '÷': 'btnDivide' };
        const btn = document.getElementById(map[op]);
        if (btn) btn.classList.add('active');
    }

    clearOperatorHighlights() {
        document.querySelectorAll('.btn-op').forEach(b => b.classList.remove('active'));
    }

    flashButton(id) {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), 120);
        }
    }

    // --- Mode ---

    setMode(mode) {
        this.mode = mode;
        const standardBtn = document.getElementById('btnStandard');
        const scientificBtn = document.getElementById('btnScientific');

        if (mode === 'scientific') {
            standardBtn.classList.remove('active');
            scientificBtn.classList.add('active');
            this.scientificPanel.classList.remove('hidden');
            this.modeToggle.setAttribute('data-mode', 'scientific');
        } else {
            scientificBtn.classList.remove('active');
            standardBtn.classList.add('active');
            this.scientificPanel.classList.add('hidden');
            this.modeToggle.setAttribute('data-mode', 'standard');
        }
    }

    // --- History ---

    toggleHistory() {
        this.historyOpen = !this.historyOpen;
        this.historyPanel.classList.toggle('open', this.historyOpen);
        document.getElementById('btnHistory').classList.toggle('active', this.historyOpen);
    }

    addToHistory(expr, result) {
        this.history.unshift({ expr, result });
        if (this.history.length > 20) this.history.pop();
        this.renderHistory();
    }

    clearHistory() {
        this.history = [];
        this.renderHistory();
    }

    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
            return;
        }

        this.historyList.innerHTML = this.history.map((item, i) => `
            <div class="history-item" data-index="${i}">
                <span class="history-expr">${this.formatExpression(item.expr)}</span>
                <span class="history-result">= ${item.result}</span>
            </div>
        `).join('');

        // Click to restore
        this.historyList.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index);
                const item = this.history[idx];
                this.expression = item.result;
                this.displayValue = item.result;
                this.isNewInput = true;
                this.lastResult = item.result;
                this.updateDisplay();
                this.toggleHistory();
            });
        });
    }
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
