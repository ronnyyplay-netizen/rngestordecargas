import { useState } from "react";
import { Delete } from "lucide-react";

export default function CalculatorPage() {
  const [display, setDisplay] = useState("0");
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [reset, setReset] = useState(false);

  function input(val: string) {
    if (reset) {
      setDisplay(val);
      setReset(false);
    } else {
      setDisplay(display === "0" ? val : display + val);
    }
  }

  function handleOp(nextOp: string) {
    const current = parseFloat(display);
    if (prevVal !== null && op) {
      const result = calc(prevVal, current, op);
      setDisplay(String(result));
      setPrevVal(result);
    } else {
      setPrevVal(current);
    }
    setOp(nextOp);
    setReset(true);
  }

  function calc(a: number, b: number, o: string) {
    switch (o) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  }

  function equals() {
    if (prevVal !== null && op) {
      const result = calc(prevVal, parseFloat(display), op);
      setDisplay(String(parseFloat(result.toFixed(10))));
      setPrevVal(null);
      setOp(null);
      setReset(true);
    }
  }

  function clear() {
    setDisplay("0");
    setPrevVal(null);
    setOp(null);
  }

  const buttons = [
    ["C", "±", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "⌫", "="],
  ];

  function handleClick(btn: string) {
    switch (btn) {
      case "C": clear(); break;
      case "±": setDisplay(String(parseFloat(display) * -1)); break;
      case "%": setDisplay(String(parseFloat(display) / 100)); break;
      case "÷": case "×": case "-": case "+": handleOp(btn); break;
      case "=": equals(); break;
      case "⌫": setDisplay(display.length > 1 ? display.slice(0, -1) : "0"); break;
      case ".": if (!display.includes(".")) setDisplay(display + "."); break;
      default: input(btn);
    }
  }

  const isOp = (b: string) => ["÷", "×", "-", "+"].includes(b);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in-up">
      <h1 className="text-2xl font-bold mb-6">Calculadora</h1>
      <div className="w-72 bg-card rounded-2xl shadow-xl border overflow-hidden">
        <div className="px-5 pt-6 pb-3 text-right">
          <p className="text-xs text-muted-foreground h-5">
            {prevVal !== null ? `${prevVal} ${op}` : ""}
          </p>
          <p className="text-3xl font-bold tabular-nums truncate">{display}</p>
        </div>
        <div className="p-3 grid grid-cols-4 gap-2">
          {buttons.flat().map((btn) => (
            <button
              key={btn}
              onClick={() => handleClick(btn)}
              className={`h-12 rounded-xl text-sm font-semibold transition-all active:scale-95
                ${btn === "=" ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                ${btn === "C" ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : ""}
                ${isOp(btn) ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}
                ${!isOp(btn) && btn !== "=" && btn !== "C" ? "bg-muted hover:bg-muted/70" : ""}
                ${btn === "0" ? "" : ""}
              `}
            >
              {btn === "⌫" ? <Delete className="w-4 h-4 mx-auto" /> : btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
