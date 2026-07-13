from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json()
    expression = data.get("expression", "")
    operation = data.get("operation", "")

    try:
        if operation:
            result = handle_scientific(operation, data.get("value", 0))
        else:
            # Safely evaluate the math expression
            result = safe_eval(expression)

        # Format result: remove trailing zeros for clean display
        if isinstance(result, float):
            if result == int(result) and not math.isinf(result):
                result = int(result)
            elif abs(result) > 1e15 or (abs(result) < 1e-10 and result != 0):
                result = f"{result:.10e}"

        return jsonify({"success": True, "result": str(result)})

    except ZeroDivisionError:
        return jsonify({"success": False, "error": "Cannot divide by zero"})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)})
    except Exception as e:
        return jsonify({"success": False, "error": "Invalid expression"})


def safe_eval(expression):
    """Safely evaluate a mathematical expression."""
    allowed_chars = set("0123456789+-*/.() %")
    clean = expression.replace("×", "*").replace("÷", "/").replace("−", "-")

    for char in clean:
        if char not in allowed_chars:
            raise ValueError(f"Invalid character: {char}")

    if not clean.strip():
        raise ValueError("Empty expression")

    # Handle percentage
    clean = clean.replace("%", "/100")

    result = eval(clean)
    return result


def handle_scientific(operation, value):
    """Handle scientific calculator operations."""
    value = float(value)

    operations = {
        "sin": lambda v: math.sin(math.radians(v)),
        "cos": lambda v: math.cos(math.radians(v)),
        "tan": lambda v: math.tan(math.radians(v)),
        "asin": lambda v: math.degrees(math.asin(v)),
        "acos": lambda v: math.degrees(math.acos(v)),
        "atan": lambda v: math.degrees(math.atan(v)),
        "log": lambda v: math.log10(v),
        "ln": lambda v: math.log(v),
        "sqrt": lambda v: math.sqrt(v),
        "cbrt": lambda v: v ** (1 / 3) if v >= 0 else -((-v) ** (1 / 3)),
        "square": lambda v: v ** 2,
        "cube": lambda v: v ** 3,
        "factorial": lambda v: math.factorial(int(v)) if v >= 0 and v == int(v) else None,
        "abs": lambda v: abs(v),
        "inv": lambda v: 1 / v if v != 0 else None,
        "exp": lambda v: math.exp(v),
        "pi": lambda v: math.pi,
        "e": lambda v: math.e,
        "pow10": lambda v: 10 ** v,
    }

    if operation not in operations:
        raise ValueError(f"Unknown operation: {operation}")

    result = operations[operation](value)

    if result is None:
        raise ValueError("Invalid input for this operation")

    return result


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
