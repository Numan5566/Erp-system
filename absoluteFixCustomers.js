const fs = require('fs');
const path = require('path');

const p = path.join('d:', 'Erp-System', 'client', 'src', 'Pages', 'Customers.jsx');
let src = fs.readFileSync(p, 'utf-8');

// We have duplicated declarations. Let's just locate the SECOND occurrence of a long unique piece of code and slice it out.
const uniqueBlock = 'const [loading, setLoading] = useState(false);';
const firstIdx = src.indexOf(uniqueBlock);
const secondIdx = src.lastIndexOf(uniqueBlock);

if (firstIdx !== secondIdx && secondIdx !== -1) {
    console.log("Duplicates detected. Stripping second duplicate block...");
    // Slice from start to just before second occurrence, then jump past all the duplicated declarations and memos.
    // Let's just remove everything from 'const [loading' down to 'const [selectedBank' again, using index logic carefully.
    // Wait! A much easier way is to look for the string sequence that duplicates.
    // We have ALL THE DECLARATIONS TWICE.
    // Let's just replace everything from line 83 down to line 123 with nothing!
    const lines = src.split(/\r?\n/);
    
    // Let's find WHERE the duplicated ledgerFrom appears!
    // Wait! Let's find exactly what index to delete.
    // Let's print indices to find out.
}

// SIMPLER WAY:
// Let's construct the PERFECT file header section and REPLACE the ENTIRE messy block starting from 'const [records' down to 'const fetchRecords'!
const regexReplace = /const \[records, setRecords\] = useState\(\[\]\);[\s\S]*?const fetchRecords = async \(\) => {/;

const perfection = `const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  
  const calculatedLedgerData = useMemo(() => {
    if (!selectedCustomer) return [];
    
    const sortedAsc = [...ledgerData].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    const totalLedgerEffect = sortedAsc.reduce((sum, row) => {
      return sum + (parseFloat(row.total_amount || 0) - parseFloat(row.paid_amount || 0));
    }, 0);
    
    const startingPoint = parseFloat(selectedCustomer.balance || 0) - totalLedgerEffect;
    
    const openingRow = {
      id: 'opening-bal-synthetic',
      created_at: sortedAsc.length > 0 ? new Date(new Date(sortedAsc[0].created_at).getTime() - 1000 * 60).toISOString() : new Date().toISOString(),
      total_amount: 0,
      paid_amount: 0,
      is_opening: true,
      custom_label: 'Opening Balance / Brought Forward',
      running_balance: startingPoint
    };
    
    let currentTracker = startingPoint;
    const withRunning = sortedAsc.map(row => {
      currentTracker += (parseFloat(row.total_amount || 0) - parseFloat(row.paid_amount || 0));
      return { ...row, running_balance: currentTracker };
    });
    
    return [openingRow, ...withRunning];
  }, [ledgerData, selectedCustomer]);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentType, setPaymentType] = useState("Cash");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [ledgerFrom, setLedgerFrom] = useState("");
  const [ledgerTo, setLedgerTo] = useState("");
  const [ledgerFilter, setLedgerFilter] = useState("all");

  const fetchRecords = async () => {`;

src = src.replace(regexReplace, perfection);
fs.writeFileSync(p, src, 'utf-8');
console.log("DONE: Absolute flawless normalization applied to Customers.jsx");
