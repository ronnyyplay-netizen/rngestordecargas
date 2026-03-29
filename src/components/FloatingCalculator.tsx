import { useState, useEffect, useRef } from "react";
import { Calculator, X, Delete } from "lucide-react";

export function FloatingCalculator() {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [reset, setReset] = useState(false);

  function input(val: string) {
    if (reset) { setDisplay(val); setReset(false); }
    else setDisplay(display === "0" ? val : display + val);
  }

  function handleOp(nextOp: string) {
    const current = parseFloat(display);
    if (prevVal !== null && op) {
      const result = calc(prevVal, current, op);
      setDisplay(String(result));
      setPrevVal(result);
    } else setPrevVal(current);
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

  function clear() { setDisplay("0"); setPrevVal(null); setOp(null); }

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
  const calcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) calcRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const keyMap: Record<string, string> = {
      "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
      ".":".","+":"+","-":"-","*":"×","/":"÷","Enter":"=","Escape":"C","Backspace":"⌫","%":"%"
    };
    function onKey(e: KeyboardEvent) {
      const btn = keyMap[e.key];
      if (btn) { e.preventDefault(); handleClick(btn); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, display, prevVal, op, reset]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div ref={calcRef} tabIndex={-1} className="w-72 bg-card rounded-2xl shadow-2xl border overflow-hidden animate-scale-in outline-none">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calculadora</span>
            <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 pt-2 pb-3 text-right">
            <p className="text-xs text-muted-foreground h-5">
              {prevVal !== null ? `${prevVal} ${op}` : ""}
            </p>
            <p className="text-3xl font-bold tabular-nums truncate text-foreground">{display}</p>
          </div>
          <div className="p-3 grid grid-cols-4 gap-2">
            {buttons.flat().map((btn) => (
              <button
                key={btn}
                onClick={() => handleClick(btn)}
                className={`h-11 rounded-xl text-sm font-semibold transition-all active:scale-95
                  ${btn === "=" ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                  ${btn === "C" ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : ""}
                  ${isOp(btn) ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}
                  ${!isOp(btn) && btn !== "=" && btn !== "C" ? "bg-muted hover:bg-muted/70 text-foreground" : ""}
                `}
              >
                {btn === "⌫" ? <Delete className="w-4 h-4 mx-auto" /> : btn}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
      >
        <Calculator className="w-6 h-6" />
      </button>
    </div>
  );
}
